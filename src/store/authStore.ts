
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
          
          // Log for debugging
          console.log('Attempting login with:', username);
          console.log('Available users:', users.map(u => ({ username: u.username, role: u.role, active: u.active })));
          
          // Find the user with matching username and password
          const user = users.find(
            u => u.username.toLowerCase() === username.toLowerCase() && 
                 u.password === password && 
                 u.active
          );
          
          if (!user) {
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
