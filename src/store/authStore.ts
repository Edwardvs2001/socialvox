
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
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  resetLoginAttempts: () => void;
}

// Admin security constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds
const ADMIN_PASSWORD = 'Admin@2024!'; // Stronger admin password

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
          
          // Para depuración
          console.info('Intentando iniciar sesión con:', username, 'longitud de contraseña:', password.length);
          
          // Verificación especial para el administrador para asegurar que siempre funcione
          if (username.toLowerCase() === 'admin') {  // Make username check case-insensitive
            console.info('Verificando credenciales de administrador');
            
            // Validate admin password against the secure password
            if (password !== ADMIN_PASSWORD) {
              console.error('Contraseña de administrador incorrecta. Ingresada:', password, 'Esperada:', ADMIN_PASSWORD);
              // Increment failed login attempts for admin account
              set((state) => ({ 
                failedLoginAttempts: state.failedLoginAttempts + 1,
                lastLoginAttempt: currentTime,
                error: 'Credenciales inválidas',
                isLoading: false
              }));
              throw new Error('Credenciales inválidas');
            }
            
            console.info('Autenticación de administrador correcta');
            
            // Obtener los usuarios del userStore
            const { users, updateUser } = useUserStore.getState();
            
            // Buscar el usuario administrador
            const adminUser = users.find(u => u.username.toLowerCase() === 'admin');
            
            if (!adminUser) {
              console.error('Usuario administrador no encontrado');
              throw new Error('Usuario administrador no encontrado');
            }
            
            // Asegurar que el usuario administrador esté activo antes del intento de inicio de sesión
            if (!adminUser.active) {
              console.info('Activando usuario administrador');
              await updateUser(adminUser.id, { active: true });
            }
            
            // Establecer el usuario administrador en el estado de autenticación
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
              failedLoginAttempts: 0, // Reset counter on successful login
            });
            
            console.info('Inicio de sesión de administrador exitoso');
            return;
          }
          
          // Flujo de inicio de sesión estándar para usuarios no administradores
          // Simular llamada a API
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Obtener los usuarios del userStore
          const { users } = useUserStore.getState();
          
          // Registrar usuarios disponibles para depuración
          console.info('Usuarios disponibles:', users.map(u => ({
            id: u.id,
            username: u.username,
            password: u.password,
            role: u.role,
            active: u.active
          })));
          
          // Encontrar el usuario con nombre de usuario y contraseña coincidentes y que esté activo
          const user = users.find(
            u => u.username === username && u.password === password && u.active
          );
          
          // Registrar si se encontró el usuario
          console.info('¿Usuario encontrado?', user ? 'Sí' : 'No');
          
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
          
          // Eliminar la contraseña del objeto de usuario antes de almacenarlo en el estado
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
          });
        } catch (error) {
          console.error('Error de autenticación:', error);
          set((state) => ({
            error: error instanceof Error ? error.message : 'Error desconocido',
            isLoading: false,
            // Note: failedLoginAttempts is updated in the specific error cases above
          }));
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
      
      resetLoginAttempts: () => {
        set({ failedLoginAttempts: 0, lastLoginAttempt: null });
      },
    }),
    {
      name: 'encuestas-va-auth',
      partialize: (state) => ({ 
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        // Include these in persisted state to maintain lockout between sessions
        failedLoginAttempts: state.failedLoginAttempts,
        lastLoginAttempt: state.lastLoginAttempt, 
      }),
    }
  )
);
