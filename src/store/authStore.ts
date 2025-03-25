
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

// Mock users for development
const mockUsers = [
  { id: '1', username: 'admin', name: 'Admin User', role: 'admin' as UserRole, password: 'admin123' },
  { id: '2', username: 'surveyor', name: 'Surveyor User', role: 'surveyor' as UserRole, password: 'surveyor123' },
  { id: '3', username: 'manager', name: 'Manager Admin', role: 'admin-manager' as UserRole, password: 'manager123' },
];

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
          // Simulate API call with mock data
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const user = mockUsers.find(
            u => u.username === username && u.password === password
          );
          
          if (!user) {
            throw new Error('Credenciales inválidas');
          }
          
          const { password: _, ...userWithoutPassword } = user;
          
          set({
            user: userWithoutPassword,
            token: 'mock-jwt-token',
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
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
