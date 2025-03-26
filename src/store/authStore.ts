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
  failedLoginAttempts: number;
  lastLoginAttempt: number | null;
  adminPassword: string;
  sessionExpiration: number | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  resetLoginAttempts: () => void;
  checkSession: () => boolean;
  refreshSession: () => void;
  changeAdminPassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

// Admin security constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds
const DEFAULT_ADMIN_PASSWORD = 'Admin@2024!'; // Default admin password
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      failedLoginAttempts: 0,
      lastLoginAttempt: null,
      adminPassword: DEFAULT_ADMIN_PASSWORD,
      sessionExpiration: null,
      
      checkSession: () => {
        const { sessionExpiration, isAuthenticated } = get();
        
        // If not authenticated, no need to check
        if (!isAuthenticated) return false;
        
        // If session has expired, return false
        if (sessionExpiration && Date.now() > sessionExpiration) {
          console.info('Sesión expirada, cerrando sesión automáticamente');
          // Don't call logout directly here to avoid state updates during render
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
          // This helps reduce unnecessary state updates
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
          const { failedLoginAttempts, lastLoginAttempt } = get();
          
          // Check if account is locked out
          if (failedLoginAttempts >= MAX_LOGIN_ATTEMPTS && lastLoginAttempt) {
            const timeElapsed = currentTime - lastLoginAttempt;
            if (timeElapsed < LOCKOUT_TIME) {
              const minutesLeft = Math.ceil((LOCKOUT_TIME - timeElapsed) / 60000);
              throw new Error(`Demasiados intentos fallidos. Intente nuevamente en ${minutesLeft} minutos.`);
            } else {
              // Reset lockout if time has passed
              set({ failedLoginAttempts: 0 });
            }
          }
          
          // Admin login handling - always case insensitive
          if (username.toLowerCase() === 'admin') {
            // Simplify admin password check - always use adminPassword from state
            const adminPasswordFromState = get().adminPassword;
            
            if (password !== adminPasswordFromState) {
              // Increment failed login attempts and throw error
              set((state) => ({ 
                failedLoginAttempts: state.failedLoginAttempts + 1,
                lastLoginAttempt: currentTime,
                error: 'Credenciales inválidas. La contraseña de administrador es incorrecta.',
                isLoading: false
              }));
              throw new Error('Credenciales inválidas');
            }
            
            // Get users from userStore
            const { users, createUser, updateUser } = useUserStore.getState();
            
            // Find admin user (case-insensitive)
            const adminUser = users.find(u => u.username.toLowerCase() === 'admin');
            
            if (!adminUser) {
              // Create admin user if not found
              const newAdminUser = await createUser({
                username: 'admin',
                password: adminPasswordFromState,
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
                failedLoginAttempts: 0,
                sessionExpiration: currentTime + SESSION_TIMEOUT,
              });
              
              return;
            }
            
            // Ensure admin user is active and password is synced
            await updateUser(adminUser.id, { 
              active: true,
              password: adminPasswordFromState
            });
            
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
              failedLoginAttempts: 0,
              sessionExpiration: currentTime + SESSION_TIMEOUT,
            });
            
            return;
          }
          
          // Standard login flow for non-admin users
          const { users } = useUserStore.getState();
          
          // Find user with matching username, password and active status
          // Case-insensitive username comparison for better user experience
          const user = users.find(
            u => u.username.toLowerCase() === username.toLowerCase() && 
                 u.password === password && 
                 u.active
          );
          
          if (!user) {
            // Increment failed attempts on login failure
            set((state) => ({ 
              failedLoginAttempts: state.failedLoginAttempts + 1,
              lastLoginAttempt: currentTime,
              error: 'Credenciales inválidas o usuario inactivo',
              isLoading: false
            }));
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
            failedLoginAttempts: 0, // Reset counter on successful login
            sessionExpiration: currentTime + SESSION_TIMEOUT, // Set session expiration
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
      
      resetLoginAttempts: () => {
        set({ failedLoginAttempts: 0, lastLoginAttempt: null });
      },
      
      changeAdminPassword: async (currentPassword, newPassword) => {
        set({ isLoading: true, error: null });
        
        try {
          const { adminPassword } = get();
          
          // Verify current password
          if (currentPassword !== adminPassword) {
            set({ 
              error: 'La contraseña actual es incorrecta',
              isLoading: false 
            });
            throw new Error('La contraseña actual es incorrecta');
          }
          
          // Validate new password
          if (newPassword.length < 8) {
            set({ 
              error: 'La nueva contraseña debe tener al menos 8 caracteres',
              isLoading: false 
            });
            throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
          }
          
          // Check for password strength
          const hasUpperCase = /[A-Z]/.test(newPassword);
          const hasLowerCase = /[a-z]/.test(newPassword);
          const hasNumbers = /\d/.test(newPassword);
          const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
          
          if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
            set({ 
              error: 'La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales',
              isLoading: false 
            });
            throw new Error('La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales');
          }
          
          // Update admin password
          set({ 
            adminPassword: newPassword,
            isLoading: false 
          });
          
          // Also update the password in userStore to keep them in sync
          const { users, updateUser } = useUserStore.getState();
          const adminUser = users.find(u => u.username.toLowerCase() === 'admin');
          
          if (adminUser) {
            await updateUser(adminUser.id, { password: newPassword });
          }
          
          return;
        } catch (error) {
          console.error('Error al cambiar la contraseña:', error);
          if (!get().error) {
            set({ 
              error: error instanceof Error ? error.message : 'Error al cambiar la contraseña',
              isLoading: false 
            });
          }
          throw error;
        }
      },
    }),
    {
      name: 'encuestas-va-auth',
      partialize: (state) => ({ 
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        failedLoginAttempts: state.failedLoginAttempts,
        lastLoginAttempt: state.lastLoginAttempt,
        adminPassword: state.adminPassword,
        sessionExpiration: state.sessionExpiration,
      }),
    }
  )
);
