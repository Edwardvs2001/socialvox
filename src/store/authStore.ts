
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useUserStore } from './userStore';

export type UserRole = 'admin' | 'surveyor';

interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      login: async (username, password) => {
        set({ isLoading: true, error: null });
        
        try {
          // For debugging
          console.info('Attempting login with:', username, 'password length:', password.length);
          
          // Special check for admin user to ensure it always works
          if (username === 'admin' && password === 'admin123') {
            // Get the users from the userStore
            const { users, updateUser } = useUserStore.getState();
            
            // Find the admin user
            const adminUser = users.find(u => u.username === 'admin');
            
            if (!adminUser) {
              throw new Error('Usuario administrador no encontrado');
            }
            
            // Ensure admin user is active before login attempt
            if (!adminUser.active) {
              await updateUser(adminUser.id, { active: true });
              console.info('Admin user activated');
            }
            
            // Set admin user in auth state
            set({
              user: {
                id: adminUser.id,
                username: adminUser.username,
                name: adminUser.name,
                role: adminUser.role
              },
              token: 'mock-jwt-token',
              isAuthenticated: true,
              isLoading: false,
            });
            
            return;
          }
          
          // Standard login flow for non-admin users
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Get the users from the userStore
          const { users } = useUserStore.getState();
          
          // Log available users for debugging
          console.info('Available users:', users.map(u => ({
            id: u.id,
            username: u.username,
            password: u.password,
            role: u.role,
            active: u.active
          })));
          
          // Find the user with matching username and password
          const user = users.find(
            u => u.username === username && u.password === password && u.active
          );
          
          // Log whether user was found
          console.info('User found?', user ? 'Yes' : 'No');
          
          if (!user) {
            throw new Error('Credenciales inválidas o usuario inactivo');
          }
          
          // Remove password from user object before storing in state
          const userWithoutPassword = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role
          };
          
          set({
            user: userWithoutPassword,
            token: 'mock-jwt-token',
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Authentication error:', error);
          set({
            error: error instanceof Error ? error.message : 'Error desconocido',
            isLoading: false,
          });
          throw error;
        }
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
      
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'encuestas-va-auth',
      partialize: (state) => ({ 
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
