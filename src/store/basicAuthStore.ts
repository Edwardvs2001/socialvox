
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type UserRole = 'admin' | 'surveyor' | 'admin-manager';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  password: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  failedLoginAttempts: number;
  lastLoginAttempt: number | null;
  sessionExpiration: number | null;
  users: User[];
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  resetLoginAttempts: () => void;
  checkSession: () => boolean;
  refreshSession: () => void;
  createUser: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  changePassword: (userId: string, newPassword: string) => Promise<void>;
}

// Auth security constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

// Create default admin user
const defaultAdmin: User = {
  id: '1',
  username: 'admin',
  name: 'Administrador',
  email: 'admin@encuestasva.com',
  role: 'admin',
  active: true,
  createdAt: new Date().toISOString(),
  password: 'Admin@2024!'
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      failedLoginAttempts: 0,
      lastLoginAttempt: null,
      sessionExpiration: null,
      users: [defaultAdmin],
      
      checkSession: () => {
        const { sessionExpiration } = get();
        if (!sessionExpiration) return false;
        
        return Date.now() < sessionExpiration;
      },
      
      refreshSession: () => {
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
          const { failedLoginAttempts, lastLoginAttempt, users } = get();
          
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
          
          // Special case for "admin" login (convenience feature)
          let finalEmail = email;
          if (email.toLowerCase() === 'admin') {
            finalEmail = 'admin@encuestasva.com';
            console.log('Using admin@encuestasva.com for login with "admin"');
          }
          
          // Find user by email
          const user = users.find(u => 
            u.email.toLowerCase() === finalEmail.toLowerCase() && 
            u.active === true
          );
          
          if (!user) {
            throw new Error('Usuario no encontrado o inactivo');
          }
          
          // Check password
          if (user.password !== password) {
            throw new Error('Credenciales inválidas');
          }
          
          // Successfully logged in
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            failedLoginAttempts: 0,
            sessionExpiration: currentTime + SESSION_TIMEOUT,
          });
          
          console.log('Login successful:', user.username);
          
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
      
      logout: () => {
        set({
          user: null,
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
      
      createUser: async (userData) => {
        set({ isLoading: true, error: null });
        
        try {
          const { users } = get();
          
          // Check if username already exists
          if (users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
            throw new Error('El nombre de usuario ya existe');
          }
          
          // Check if email already exists
          if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
            throw new Error('El correo electrónico ya está registrado');
          }
          
          // Create new user
          const newUser: User = {
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            ...userData
          };
          
          // Update users list
          set(state => ({
            users: [...state.users, newUser],
            isLoading: false
          }));
          
          console.log('User created successfully:', newUser);
          
          return newUser;
        } catch (error) {
          console.error('Error creating user:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al crear usuario',
            isLoading: false,
          });
          throw error;
        }
      },
      
      updateUser: async (id, updates) => {
        set({ isLoading: true, error: null });
        
        try {
          const { users } = get();
          
          // Find user
          const userIndex = users.findIndex(u => u.id === id);
          if (userIndex === -1) {
            throw new Error('Usuario no encontrado');
          }
          
          // Check username uniqueness if being updated
          if (updates.username && 
              users.some(u => u.id !== id && u.username.toLowerCase() === updates.username!.toLowerCase())) {
            throw new Error('El nombre de usuario ya existe');
          }
          
          // Check email uniqueness if being updated
          if (updates.email && 
              users.some(u => u.id !== id && u.email.toLowerCase() === updates.email!.toLowerCase())) {
            throw new Error('El correo electrónico ya está registrado');
          }
          
          // Update user
          const updatedUsers = [...users];
          updatedUsers[userIndex] = {
            ...updatedUsers[userIndex],
            ...updates
          };
          
          set({
            users: updatedUsers,
            isLoading: false
          });
          
          // Update current user if it's the same
          const { user } = get();
          if (user && user.id === id) {
            set({
              user: {
                ...user,
                ...updates
              }
            });
          }
          
          console.log('User updated successfully:', id);
        } catch (error) {
          console.error('Error updating user:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al actualizar usuario',
            isLoading: false,
          });
          throw error;
        }
      },
      
      deleteUser: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          const { users } = get();
          
          // Check if trying to delete admin user
          const user = users.find(u => u.id === id);
          if (user && user.username.toLowerCase() === 'admin') {
            throw new Error('No se puede eliminar el usuario administrador');
          }
          
          // Update users list
          set(state => ({
            users: state.users.filter(u => u.id !== id),
            isLoading: false
          }));
          
          console.log('User deleted successfully:', id);
        } catch (error) {
          console.error('Error deleting user:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al eliminar usuario',
            isLoading: false,
          });
          throw error;
        }
      },
      
      changePassword: async (userId, newPassword) => {
        try {
          const { users } = get();
          
          // Find user
          const userIndex = users.findIndex(u => u.id === userId);
          if (userIndex === -1) {
            throw new Error('Usuario no encontrado');
          }
          
          // Update password
          const updatedUsers = [...users];
          updatedUsers[userIndex] = {
            ...updatedUsers[userIndex],
            password: newPassword
          };
          
          set({
            users: updatedUsers
          });
          
          console.log('Password changed successfully for user:', userId);
        } catch (error) {
          console.error('Error changing password:', error);
          throw error;
        }
      },
    }),
    {
      name: 'encuestas-va-auth',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        failedLoginAttempts: state.failedLoginAttempts,
        lastLoginAttempt: state.lastLoginAttempt,
        sessionExpiration: state.sessionExpiration,
        users: state.users,
      }),
    }
  )
);
