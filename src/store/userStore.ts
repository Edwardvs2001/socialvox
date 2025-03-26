
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from './authStore';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  password?: string;
}

interface UserState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  
  fetchUsers: () => Promise<void>;
  getUserById: (id: string) => Promise<User | undefined>;
  createUser: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      users: [],
      isLoading: false,
      error: null,
      
      fetchUsers: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Fetch users from Supabase
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          
          // Transform data to match User interface
          const users: User[] = data.map(profile => ({
            id: profile.id,
            username: profile.username,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            active: profile.active,
            createdAt: profile.created_at,
          }));
          
          set({ users, isLoading: false });
        } catch (error) {
          console.error('Error fetching users:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al cargar usuarios',
            isLoading: false,
          });
        }
      },
      
      getUserById: async (id) => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
          
          if (error) throw error;
          
          // Transform to User interface
          return {
            id: data.id,
            username: data.username,
            name: data.name,
            email: data.email,
            role: data.role,
            active: data.active,
            createdAt: data.created_at,
          };
        } catch (error) {
          console.error('Error fetching user:', error);
          return undefined;
        }
      },
      
      createUser: async (userData) => {
        set({ isLoading: true, error: null });
        
        try {
          // Case-insensitive username check
          const { data: existingUsernames } = await supabase
            .from('profiles')
            .select('username')
            .ilike('username', userData.username);
          
          if (existingUsernames && existingUsernames.length > 0) {
            throw new Error('El nombre de usuario ya existe');
          }
          
          // Case-insensitive email check
          const { data: existingEmails } = await supabase
            .from('profiles')
            .select('email')
            .ilike('email', userData.email);
          
          if (existingEmails && existingEmails.length > 0) {
            throw new Error('El correo electrónico ya está registrado');
          }
          
          // Create user in Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: userData.email,
            password: userData.password || generateStrongPassword(),
            email_confirm: true,
            user_metadata: {
              username: userData.username,
              name: userData.name,
              role: userData.role,
            }
          });
          
          if (authError) throw authError;
          
          if (!authData.user) {
            throw new Error('No se pudo crear el usuario');
          }
          
          // Update active status in profiles (since trigger creates the profile)
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ active: userData.active })
            .eq('id', authData.user.id);
          
          if (updateError) throw updateError;
          
          // Fetch newly created profile
          const { data: newProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();
          
          if (profileError) throw profileError;
          
          // Create User object from profile
          const newUser: User = {
            id: newProfile.id,
            username: newProfile.username,
            name: newProfile.name,
            email: newProfile.email,
            role: newProfile.role,
            active: newProfile.active,
            createdAt: newProfile.created_at,
            password: userData.password,
          };
          
          // Update local state
          set(state => ({
            users: [newUser, ...state.users],
            isLoading: false,
          }));
          
          return newUser;
        } catch (error) {
          console.error('Error creating user:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al crear usuario',
            isLoading: false,
          });
          throw error;
        }
      },
      
      updateUser: async (id, updates) => {
        set({ isLoading: true, error: null });
        
        try {
          // Check if updating username - must be unique
          if (updates.username) {
            const { data: existingUsernames } = await supabase
              .from('profiles')
              .select('username')
              .ilike('username', updates.username)
              .neq('id', id);
            
            if (existingUsernames && existingUsernames.length > 0) {
              throw new Error('El nombre de usuario ya existe');
            }
          }
          
          // Check if updating email - must be unique
          if (updates.email) {
            const { data: existingEmails } = await supabase
              .from('profiles')
              .select('email')
              .ilike('email', updates.email)
              .neq('id', id);
            
            if (existingEmails && existingEmails.length > 0) {
              throw new Error('El correo electrónico ya está registrado');
            }
          }
          
          // If password is being updated, update auth user
          if (updates.password) {
            const { error: passwordError } = await supabase.auth.admin.updateUserById(
              id,
              { password: updates.password }
            );
            
            if (passwordError) throw passwordError;
          }
          
          // If email is being updated, update auth user
          if (updates.email) {
            const { error: emailError } = await supabase.auth.admin.updateUserById(
              id,
              { email: updates.email }
            );
            
            if (emailError) throw emailError;
          }
          
          // Update user metadata if needed
          const userMetadata: Record<string, any> = {};
          
          if (updates.username) userMetadata.username = updates.username;
          if (updates.name) userMetadata.name = updates.name;
          if (updates.role) userMetadata.role = updates.role;
          
          if (Object.keys(userMetadata).length > 0) {
            const { error: metadataError } = await supabase.auth.admin.updateUserById(
              id,
              { user_metadata: userMetadata }
            );
            
            if (metadataError) throw metadataError;
          }
          
          // Update profile in profiles table
          const profileUpdates: Record<string, any> = {};
          
          if (updates.username) profileUpdates.username = updates.username;
          if (updates.name) profileUpdates.name = updates.name;
          if (updates.email) profileUpdates.email = updates.email;
          if (updates.role) profileUpdates.role = updates.role;
          if (updates.active !== undefined) profileUpdates.active = updates.active;
          
          if (Object.keys(profileUpdates).length > 0) {
            const { error: profileError } = await supabase
              .from('profiles')
              .update(profileUpdates)
              .eq('id', id);
            
            if (profileError) throw profileError;
          }
          
          // Update local state
          await get().fetchUsers(); // Reload users from server
          
          set({ isLoading: false });
        } catch (error) {
          console.error('Error updating user:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al actualizar usuario',
            isLoading: false,
          });
          throw error;
        }
      },
      
      deleteUser: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          // Check if trying to delete admin user
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('username, role')
            .eq('id', id)
            .single();
          
          if (userProfile && userProfile.username.toLowerCase() === 'admin') {
            throw new Error('No se puede eliminar el usuario administrador');
          }
          
          // Delete user from Supabase Auth
          const { error: deleteError } = await supabase.auth.admin.deleteUser(id);
          
          if (deleteError) throw deleteError;
          
          // Update local state
          set(state => ({
            users: state.users.filter(user => user.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Error deleting user:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al eliminar usuario',
            isLoading: false,
          });
          throw error;
        }
      },
      
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'encuestas-va-users',
      partialize: (state) => ({
        users: state.users,
      }),
    }
  )
);

// Helper function to generate a strong password
function generateStrongPassword(length = 12) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}
