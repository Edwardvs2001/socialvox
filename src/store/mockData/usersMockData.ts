
import { UserRole } from '../authStore';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  password?: string; // Optional in interface for security
}

// Mock users data
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    name: 'Admin Principal',
    email: 'admin@encuestasva.com',
    role: 'admin-manager',
    active: true,
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
  },
  {
    id: '3',
    username: 'manager',
    name: 'María Gómez',
    email: 'maria@encuestasva.com',
    role: 'admin',
    active: true,
    createdAt: '2023-02-05T14:45:00Z',
    password: 'manager123',
  },
  {
    id: '4',
    username: 'surveyor2',
    name: 'Carlos Rodríguez',
    email: 'carlos@encuestasva.com',
    role: 'surveyor',
    active: true,
    createdAt: '2023-03-20T09:15:00Z',
    password: 'surveyor123',
  },
  {
    id: '5',
    username: 'victoria2026',
    name: 'Victoria Administradora',
    email: 'victoria@encuestasva.com',
    role: 'admin',
    active: true,
    createdAt: '2023-06-15T11:30:00Z',
    password: 'victoria2026',
  }
];
