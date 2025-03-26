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
          // Para depuración
          console.info('Intentando iniciar sesión con:', username, 'longitud de contraseña:', password.length);
          
          // Verificación especial para el administrador para asegurar que siempre funcione
          if (username === 'admin' && password === 'admin123') {
            console.info('Autenticación de administrador correcta');
            
            // Obtener los usuarios del userStore
            const { users, updateUser } = useUserStore.getState();
            
            // Buscar el usuario administrador
            const adminUser = users.find(u => u.username === 'admin');
            
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
          });
        } catch (error) {
          console.error('Error de autenticación:', error);
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
