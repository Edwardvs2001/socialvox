
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from './authStore';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  password?: string; // Added password field, optional in interface for security
}

interface UserState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  
  fetchUsers: () => Promise<void>;
  getUserById: (id: string) => User | undefined;
  createUser: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  clearError: () => void;
}

// Initial mock data with admin always active and secure password
const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    name: 'Administrador',
    email: 'admin@encuestasva.com',
    role: 'admin',
    active: true, // Ensure admin is always active
    createdAt: '2023-01-10T08:00:00Z',
    password: 'Admin@2024!', // Default admin password
  },
  {
    id: '2',
    username: 'surveyor',
    name: 'Juan Pérez',
    email: 'juan@encuestasva.com',
    role: 'surveyor',
    active: true,
    createdAt: '2023-01-15T10:30:00Z',
    password: 'surveyor123',
  }
];

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      users: mockUsers,
      isLoading: false,
      error: null,
      
      fetchUsers: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Make sure admin user is always active
          const users = get().users;
          const adminUser = users.find(u => u.username.toLowerCase() === 'admin' && u.role === 'admin');
          
          if (adminUser && !adminUser.active) {
            // Activate admin user if it's inactive
            set(state => ({
              users: state.users.map(user => 
                user.id === adminUser.id ? { ...user, active: true } : user
              )
            }));
          }
          
          // Make sure admin password matches across stores
          if (adminUser) {
            const authStore = require('./authStore').useAuthStore.getState();
            if (adminUser.password !== authStore.adminPassword) {
              // Update admin password in user store
              set(state => ({
                users: state.users.map(user => 
                  user.id === adminUser.id ? { ...user, password: authStore.adminPassword } : user
                )
              }));
            }
          }
          
          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error al cargar usuarios',
            isLoading: false,
          });
        }
      },
      
      getUserById: (id) => {
        // Before returning any user, ensure admin is active
        const users = get().users;
        const adminUser = users.find(u => u.username === 'admin' && u.role === 'admin');
        
        if (adminUser && !adminUser.active) {
          set(state => ({
            users: state.users.map(user => 
              user.id === adminUser.id ? { ...user, active: true } : user
            )
          }));
        }
        
        return get().users.find(user => user.id === id);
      },
      
      createUser: async (userData) => {
        set({ isLoading: true, error: null });
        
        try {
          // Check if username already exists
          if (get().users.some(user => user.username.toLowerCase() === userData.username.toLowerCase())) {
            throw new Error('El nombre de usuario ya existe');
          }
          
          // Check if email already exists
          if (get().users.some(user => user.email.toLowerCase() === userData.email.toLowerCase())) {
            throw new Error('El correo electrónico ya está registrado');
          }
          
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const newUser: User = {
            ...userData,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
          };
          
          // If creating admin user, update admin password in auth store
          if (newUser.username.toLowerCase() === 'admin' && newUser.role === 'admin' && newUser.password) {
            try {
              const authStore = require('./authStore').useAuthStore.getState();
              authStore.adminPassword = newUser.password;
            } catch (error) {
              console.error('Error syncing admin password with auth store:', error);
            }
          }
          
          set(state => ({
            users: [...state.users, newUser],
            isLoading: false,
          }));
          
          return newUser;
        } catch (error) {
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
          // If username is being updated, check it doesn't conflict
          if (updates.username) {
            const existingUser = get().users.find(
              user => user.username.toLowerCase() === updates.username?.toLowerCase() && user.id !== id
            );
            
            if (existingUser) {
              throw new Error('El nombre de usuario ya existe');
            }
          }
          
          // If email is being updated, check it doesn't conflict
          if (updates.email) {
            const existingUser = get().users.find(
              user => user.email.toLowerCase() === updates.email?.toLowerCase() && user.id !== id
            );
            
            if (existingUser) {
              throw new Error('El correo electrónico ya está registrado');
            }
          }
          
          // If updating admin user with new password, sync with auth store
          const user = get().users.find(u => u.id === id);
          if (user && user.username.toLowerCase() === 'admin' && user.role === 'admin' && updates.password) {
            try {
              const authStore = require('./authStore').useAuthStore.getState();
              authStore.adminPassword = updates.password;
            } catch (error) {
              console.error('Error syncing admin password with auth store:', error);
            }
          }
          
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set(state => ({
            users: state.users.map(user => 
              user.id === id ? { ...user, ...updates } : user
            ),
            isLoading: false,
          }));
        } catch (error) {
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
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 800));
          
          set(state => ({
            users: state.users.filter(user => user.id !== id),
            isLoading: false,
          }));
        } catch (error) {
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
      // Add migration to ensure admin is always active and has the right password
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Check if admin exists and is active
            const adminUser = state.users.find(u => u.username.toLowerCase() === 'admin' && u.role === 'admin');
            
            if (adminUser) {
              if (!adminUser.active) {
                // Activate admin user
                state.users = state.users.map(user => 
                  user.id === adminUser.id ? { ...user, active: true } : user
                );
              }
              
              // Ensure admin password matches default if it hasn't been set
              if (!adminUser.password) {
                state.users = state.users.map(user => 
                  user.id === adminUser.id ? { ...user, password: 'Admin@2024!' } : user
                );
              }
            }
          }
        };
      }
    }
  )
);
