import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from './authStore';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  password?: string;
}

interface UserState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  
  fetchUsers: () => Promise<void>;
  getUserById: (id: string) => User | undefined;
  createUser: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  clearError: () => void;
}

const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    name: 'Admin Principal',
    email: 'admin@encuestasva.com',
    role: 'admin',
    active: true,
    createdAt: '2023-01-10T08:00:00Z',
    password: 'Fondismo1',
  },
  {
    id: '2',
    username: 'surveyor',
    name: 'Juan Pérez',
    email: 'juan@encuestasva.com',
    role: 'surveyor',
    active: true,
    createdAt: '2023-01-15T10:30:00Z',
    password: 'surveyor123',
  }
];

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      users: mockUsers,
      isLoading: false,
      error: null,
      
      fetchUsers: async () => {
        set({ isLoading: true, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const users = get().users;
          const adminUser = users.find(u => u.username.toLowerCase() === 'admin' && u.role === 'admin');
          
          if (adminUser) {
            const updates: Partial<User> = {};
            let needsUpdate = false;
            
            if (!adminUser.active) {
              updates.active = true;
              needsUpdate = true;
            }
            
            if (needsUpdate) {
              set(state => ({
                users: state.users.map(user => 
                  user.id === adminUser.id ? { ...user, ...updates } : user
                )
              }));
            }
          }
          
          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error al cargar usuarios',
            isLoading: false,
          });
        }
      },
      
      getUserById: (id) => {
        const users = get().users;
        const adminUser = users.find(u => u.username.toLowerCase() === 'admin' && u.role === 'admin');
        
        if (adminUser && !adminUser.active) {
          set(state => ({
            users: state.users.map(user => 
              user.id === adminUser.id ? { ...user, active: true } : user
            )
          }));
        }
        
        return get().users.find(user => user.id === id);
      },
      
      createUser: async (userData) => {
        set({ isLoading: true, error: null });
        
        try {
          const normalizedUsername = userData.username.toLowerCase().trim();
          
          if (get().users.some(user => user.username.toLowerCase() === normalizedUsername)) {
            throw new Error('El nombre de usuario ya existe');
          }
          
          const normalizedEmail = userData.email.toLowerCase().trim();
          if (get().users.some(user => user.email.toLowerCase() === normalizedEmail)) {
            throw new Error('El correo electrónico ya está registrado');
          }
          
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const newUser: User = {
            ...userData,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
          };
          
          set(state => ({
            users: [...state.users, newUser],
            isLoading: false,
          }));
          
          return newUser;
        } catch (error) {
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
          if (updates.username) {
            const normalizedNewUsername = updates.username.toLowerCase().trim();
            const existingUser = get().users.find(
              user => user.username.toLowerCase() === normalizedNewUsername && user.id !== id
            );
            
            if (existingUser) {
              throw new Error('El nombre de usuario ya existe');
            }
          }
          
          if (updates.email) {
            const normalizedNewEmail = updates.email.toLowerCase().trim();
            const existingUser = get().users.find(
              user => user.email.toLowerCase() === normalizedNewEmail && user.id !== id
            );
            
            if (existingUser) {
              throw new Error('El correo electrónico ya está registrado');
            }
          }
          
          const user = get().users.find(u => u.id === id);
          if (user && user.username.toLowerCase() === 'admin' && updates.password) {
            try {
              const authStore = require('./authStore').useAuthStore;
              const currentPassword = authStore.getState().adminPassword;
              
              if (updates.password !== currentPassword) {
                authStore.setState({ adminPassword: updates.password });
                console.log('Admin password synchronized with authStore');
              }
            } catch (e) {
              console.error('Error al sincronizar contraseña con authStore:', e);
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 800));
          
          set(state => ({
            users: state.users.map(user => 
              user.id === id ? { ...user, ...updates } : user
            ),
            isLoading: false,
          }));
        } catch (error) {
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
          const user = get().users.find(u => u.id === id);
          if (user && user.username.toLowerCase() === 'admin') {
            throw new Error('No se puede eliminar el usuario administrador');
          }
          
          await new Promise(resolve => setTimeout(resolve, 800));
          
          set(state => ({
            users: state.users.filter(user => user.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error al eliminar usuario',
            isLoading: false,
          });
          throw error;
        }
      },
      
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'encuestas-va-users',
      partialize: (state) => ({
        users: state.users,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            const adminUser = state.users.find(u => u.username.toLowerCase() === 'admin' && u.role === 'admin');
            
            if (adminUser) {
              if (!adminUser.active) {
                state.users = state.users.map(user => 
                  user.id === adminUser.id ? { ...user, active: true } : user
                );
              }
              
              if (adminUser.password !== 'Fondismo1') {
                state.users = state.users.map(user => 
                  user.id === adminUser.id ? { ...user, password: 'Fondismo1' } : user
                );
              }
            } else {
              state.users.push({
                id: '1',
                username: 'admin',
                name: 'Administrador',
                email: 'admin@encuestasva.com',
                role: 'admin',
                active: true,
                createdAt: new Date().toISOString(),
                password: 'Fondismo1',
              });
            }
          }
        };
      }
    }
  )
);
