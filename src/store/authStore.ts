
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
  sessionExpiration: number | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkSession: () => boolean;
  refreshSession: () => void;
}

// Session timeout set to 8 hours in milliseconds
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      sessionExpiration: null,
      
      checkSession: () => {
        const { sessionExpiration, isAuthenticated } = get();
        
        // If not authenticated, no need to check
        if (!isAuthenticated) return false;
        
        // If session has expired, return false
        if (sessionExpiration && Date.now() > sessionExpiration) {
          console.info('Sesión expirada, cerrando sesión automáticamente');
          return false;
        }
        
        return true;
      },
      
      refreshSession: () => {
        // Only refresh if authenticated to avoid unnecessary state updates
        if (get().isAuthenticated) {
          // Use a stable timestamp for session expiration
          const newExpiration = Date.now() + SESSION_TIMEOUT;
          
          // Only update if the session would be extended by at least 1 minute
          const currentExpiration = get().sessionExpiration || 0;
          if (newExpiration > currentExpiration + 60000) {
            set({ 
              sessionExpiration: newExpiration,
              error: null
            });
          }
        }
      },
      
      login: async (username, password) => {
        set({ isLoading: true, error: null });
        
        try {
          const currentTime = Date.now();
          
          // Normalize username for case-insensitive comparison
          const normalizedUsername = username.toLowerCase().trim();
          
          // Admin login handling - always case insensitive
          if (normalizedUsername === 'admin') {
            // Admin login - simplified with no password check
            const { users, createUser, updateUser } = useUserStore.getState();
            
            // Find admin user (case-insensitive)
            const adminUser = users.find(u => u.username.toLowerCase() === 'admin');
            
            if (!adminUser) {
              // Create admin user if not found
              const newAdminUser = await createUser({
                username: 'admin',
                password: 'admin', // Simplified admin password
                name: 'Admin Principal',
                role: 'admin',
                active: true,
                email: 'admin@encuestasva.com'
              });
              
              // Set admin user in auth state
              set({
                user: {
                  id: newAdminUser.id,
                  username: 'admin',
                  name: 'Admin Principal',
                  role: 'admin'
                },
                token: 'mock-jwt-token',
                isAuthenticated: true,
                isLoading: false,
                sessionExpiration: currentTime + SESSION_TIMEOUT,
              });
              
              return;
            }
            
            // Ensure admin user is active
            await updateUser(adminUser.id, { active: true });
            
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
              sessionExpiration: currentTime + SESSION_TIMEOUT,
            });
            
            return;
          }
          
          // Standard login flow for non-admin users - simplified
          const { users } = useUserStore.getState();
          
          // Find user with matching username - no password check, just active status
          const user = users.find(
            u => u.username.toLowerCase() === normalizedUsername && u.active
          );
          
          if (!user) {
            set({ 
              error: 'Usuario no encontrado o inactivo',
              isLoading: false
            });
            throw new Error('Usuario no encontrado o inactivo');
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
            sessionExpiration: currentTime + SESSION_TIMEOUT,
          });
        } catch (error) {
          console.error('Error de autenticación:', error);
          if (!get().error) {
            set({
              error: error instanceof Error ? error.message : 'Error desconocido',
              isLoading: false,
            });
          }
          throw error;
        }
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          sessionExpiration: null,
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
        isAuthenticated: state.isAuthenticated,
        sessionExpiration: state.sessionExpiration,
      }),
    }
  )
);
