
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useUserStore } from './userStore';

export type UserRole = 'admin' | 'surveyor' | 'admin-manager';

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
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Get the users from the userStore
          const { users } = useUserStore.getState();
          
          // More detailed logging for debugging
          console.log('Login attempt:', { username, passwordLength: password.length });
          console.log('Available users:', users.map(u => ({ 
            id: u.id, 
            username: u.username, 
            password: u.password,
            role: u.role, 
            active: u.active 
          })));
          
          // First find the user by username (case insensitive)
          const user = users.find(
            u => u.username.toLowerCase() === username.toLowerCase()
          );
          
          // Log user found
          console.log('User found?', user ? 'Yes' : 'No');
          
          if (!user) {
            throw new Error('Credenciales inválidas o usuario inactivo');
          }
          
          // Now check password and active status
          if (user.password !== password) {
            console.log('Password mismatch:', { 
              expected: user.password, 
              provided: password 
            });
            throw new Error('Credenciales inválidas o usuario inactivo');
          }
          
          if (!user.active) {
            console.log('User is inactive');
            throw new Error('Credenciales inválidas o usuario inactivo');
          }
          
          const { password: _, ...userWithoutPassword } = user;
          
          // Log the authenticated user
          console.log('Successfully authenticated:', userWithoutPassword);
          
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
