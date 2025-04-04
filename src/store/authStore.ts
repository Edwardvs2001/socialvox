
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
  login: (username: string, password?: string) => Promise<void>;
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
          
          // Admin login handling - always case insensitive and no password required
          if (normalizedUsername === 'admin') {
            // Admin login - no password check
            const { users } = useUserStore.getState();
            
            // Find admin user (case-insensitive)
            const adminUser = users.find(u => u.username.toLowerCase() === 'admin');
            
            if (!adminUser) {
              // Buscar cualquier usuario con correo admin@encuestasva.com antes de crear uno nuevo
              const emailExists = users.find(u => u.email.toLowerCase() === 'admin@encuestasva.com');
              
              // Si existe un usuario con ese correo, usarlo como admin en vez de crear uno nuevo
              if (emailExists) {
                // Actualizar el usuario existente para que sea admin
                try {
                  const { updateUser } = useUserStore.getState();
                  await updateUser(emailExists.id, { 
                    username: 'admin',
                    role: 'admin',
                    active: true 
                  });
                  
                  // Set admin user in auth state
                  set({
                    user: {
                      id: emailExists.id,
                      username: 'admin',
                      name: emailExists.name,
                      role: 'admin'
                    },
                    token: 'mock-jwt-token',
                    isAuthenticated: true,
                    isLoading: false,
                    sessionExpiration: currentTime + SESSION_TIMEOUT,
                  });
                  
                  return;
                } catch (error) {
                  console.error('Error al actualizar usuario admin:', error);
                  set({ 
                    error: 'Error al configurar el usuario administrador',
                    isLoading: false
                  });
                  throw error;
                }
              }
              
              // Si no existe el usuario con ese correo, lo creamos con un correo diferente
              try {
                const { createUser } = useUserStore.getState();
                const newAdminUser = await createUser({
                  username: 'admin',
                  password: '', // No password required
                  name: 'Admin Principal',
                  role: 'admin',
                  active: true,
                  email: `admin_${Date.now()}@encuestasva.com` // Email único para evitar colisiones
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
              } catch (error) {
                console.error('Error al crear usuario admin:', error);
                set({ 
                  error: 'Error al crear usuario administrador',
                  isLoading: false
                });
                throw error;
              }
            }
            
            // Ensure admin user is active
            try {
              const { updateUser } = useUserStore.getState();
              await updateUser(adminUser.id, { active: true });
            } catch (error) {
              console.error('Error al actualizar estado del usuario admin:', error);
              // No lanzamos error aquí, continuamos con el login
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
              sessionExpiration: currentTime + SESSION_TIMEOUT,
            });
            
            return;
          }
          
          // Standard login flow for non-admin users - no password check, just username
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
