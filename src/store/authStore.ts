import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type UserRole = 'admin' | 'surveyor' | 'admin-manager';

interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  failedLoginAttempts: number;
  lastLoginAttempt: number | null;
  adminPassword: string;
  sessionExpiration: number | null;
  
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  resetLoginAttempts: () => void;
  checkSession: () => Promise<boolean>;
  refreshSession: () => void;
  changeAdminPassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

// Auth security constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds
const DEFAULT_ADMIN_PASSWORD = 'Admin@2024!'; // Default admin password
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      failedLoginAttempts: 0,
      lastLoginAttempt: null,
      adminPassword: DEFAULT_ADMIN_PASSWORD,
      sessionExpiration: null,
      
      checkSession: async () => {
        // Updated to use the current Supabase API
        const { data } = await supabase.auth.getSession();
        return !!data.session;
      },
      
      refreshSession: () => {
        // Supabase handles token refreshing automatically
        const currentTime = Date.now();
        set({ 
          sessionExpiration: currentTime + SESSION_TIMEOUT,
          error: null
        });
      },
      
      login: async (email, password) => {
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
          
          // Call Supabase auth login
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
          });
          
          if (error) {
            throw error;
          }
          
          if (!data.session || !data.user) {
            throw new Error('No se pudo iniciar sesión');
          }
          
          // Get user profile from profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          if (profileError) {
            throw profileError;
          }
          
          // Set user data from profile
          set({
            user: {
              id: profileData.id,
              username: profileData.username,
              name: profileData.name,
              role: profileData.role,
            },
            session: data.session,
            isAuthenticated: true,
            isLoading: false,
            failedLoginAttempts: 0,
            sessionExpiration: currentTime + SESSION_TIMEOUT,
          });
          
        } catch (error) {
          console.error('Error de autenticación:', error);
          
          // Increment failed login attempts
          set((state) => ({ 
            failedLoginAttempts: state.failedLoginAttempts + 1,
            lastLoginAttempt: Date.now(),
            error: error instanceof Error ? error.message : 'Error desconocido',
            isLoading: false,
          }));
          
          throw error;
        }
      },
      
      signup: async (email, password, userData) => {
        set({ isLoading: true, error: null });
        
        try {
          // Sign up with supabase
          const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
              data: {
                username: userData.username,
                name: userData.name,
                role: userData.role || 'surveyor',
              }
            }
          });
          
          if (error) {
            throw error;
          }
          
          // Success, but may require email confirmation
          if (data.user?.identities?.length === 0) {
            throw new Error('Este correo ya está registrado');
          }
          
          if (data.session) {
            set({
              user: {
                id: data.user.id,
                username: userData.username || '',
                name: userData.name || '',
                role: userData.role || 'surveyor',
              },
              session: data.session,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Email confirmation may be required
            set({ isLoading: false });
          }
          
        } catch (error) {
          console.error('Error en el registro:', error);
          set({
            error: error instanceof Error ? error.message : 'Error desconocido',
            isLoading: false,
          });
          throw error;
        }
      },
      
      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error('Error al cerrar sesión:', error);
        }
        
        set({
          user: null,
          session: null,
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
          // First verify current password by trying to sign in
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: 'admin@encuestasva.com', // Assuming this is admin email
            password: currentPassword,
          });
          
          if (signInError) {
            throw new Error('La contraseña actual es incorrecta');
          }
          
          // Validate new password
          if (newPassword.length < 8) {
            throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
          }
          
          // Check for password strength
          const hasUpperCase = /[A-Z]/.test(newPassword);
          const hasLowerCase = /[a-z]/.test(newPassword);
          const hasNumbers = /\d/.test(newPassword);
          const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
          
          if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
            throw new Error('La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales');
          }
          
          // Update password in Supabase
          const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
          });
          
          if (updateError) {
            throw updateError;
          }
          
          // Store the admin password in state for backward compatibility
          set({ 
            adminPassword: newPassword,
            isLoading: false 
          });
          
          return;
        } catch (error) {
          console.error('Error al cambiar la contraseña:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Error al cambiar la contraseña',
            isLoading: false 
          });
          throw error;
        }
      },
    }),
    {
      name: 'encuestas-va-auth',
      partialize: (state) => ({ 
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
        failedLoginAttempts: state.failedLoginAttempts,
        lastLoginAttempt: state.lastLoginAttempt,
        adminPassword: state.adminPassword,
        sessionExpiration: state.sessionExpiration,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Set up auth state change listener
            supabase.auth.onAuthStateChange((event, session) => {
              if (event === 'SIGNED_IN' && session) {
                // Get user profile
                setTimeout(async () => {
                  try {
                    const { data, error } = await supabase
                      .from('profiles')
                      .select('*')
                      .eq('id', session.user.id)
                      .single();
                      
                    if (error) throw error;
                    
                    // Update state with user info
                    useAuthStore.setState({
                      user: {
                        id: data.id,
                        username: data.username,
                        name: data.name,
                        role: data.role,
                      },
                      session: session,
                      isAuthenticated: true,
                    });
                  } catch (err) {
                    console.error('Error fetching user profile:', err);
                  }
                }, 0);
              } else if (event === 'SIGNED_OUT') {
                useAuthStore.setState({
                  user: null,
                  session: null,
                  isAuthenticated: false,
                });
              }
            });
            
            // Check for existing session on page load
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session) {
                // Get user profile
                setTimeout(async () => {
                  try {
                    const { data, error } = await supabase
                      .from('profiles')
                      .select('*')
                      .eq('id', session.user.id)
                      .single();
                      
                    if (error) throw error;
                    
                    // Update state with user info
                    useAuthStore.setState({
                      user: {
                        id: data.id,
                        username: data.username,
                        name: data.name,
                        role: data.role,
                      },
                      session: session,
                      isAuthenticated: true,
                    });
                  } catch (err) {
                    console.error('Error fetching user profile:', err);
                  }
                }, 0);
              }
            }).catch(err => {
              console.error('Error checking session:', err);
            });
          }
        };
      }
    }
  )
);
