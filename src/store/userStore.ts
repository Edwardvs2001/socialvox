
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
  password?: string; // Added password field, optional in interface for security
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

// Initial mock data with admin always active
const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    name: 'Administrador',
    email: 'admin@encuestasva.com',
    role: 'admin',
    active: true, // Ensure admin is always active
    createdAt: '2023-01-10T08:00:00Z',
    password: 'admin123',
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
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Make sure admin user is always active
          const users = get().users;
          const adminUser = users.find(u => u.username === 'admin' && u.role === 'admin');
          
          if (adminUser && !adminUser.active) {
            // Activate admin user if it's inactive
            set(state => ({
              users: state.users.map(user => 
                user.id === adminUser.id ? { ...user, active: true } : user
              )
            }));
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
        // Before returning any user, ensure admin is active
        const users = get().users;
        const adminUser = users.find(u => u.username === 'admin' && u.role === 'admin');
        
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
          // Check if username already exists
          if (get().users.some(user => user.username === userData.username)) {
            throw new Error('El nombre de usuario ya existe');
          }
          
          // Check if email already exists
          if (get().users.some(user => user.email === userData.email)) {
            throw new Error('El correo electrónico ya está registrado');
          }
          
          // Simulate API call
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
          // If username is being updated, check it doesn't conflict
          if (updates.username) {
            const existingUser = get().users.find(
              user => user.username === updates.username && user.id !== id
            );
            
            if (existingUser) {
              throw new Error('El nombre de usuario ya existe');
            }
          }
          
          // If email is being updated, check it doesn't conflict
          if (updates.email) {
            const existingUser = get().users.find(
              user => user.email === updates.email && user.id !== id
            );
            
            if (existingUser) {
              throw new Error('El correo electrónico ya está registrado');
            }
          }
          
          // Simulate API call
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
          // Simulate API call
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
      // Add migration to ensure admin is always active
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Check if admin exists and is active
            const adminUser = state.users.find(u => u.username === 'admin' && u.role === 'admin');
            
            if (adminUser && !adminUser.active) {
              // Activate admin user
              state.users = state.users.map(user => 
                user.id === adminUser.id ? { ...user, active: true } : user
              );
            }
          }
        };
      }
    }
  )
);
