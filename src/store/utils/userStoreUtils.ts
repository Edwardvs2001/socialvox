
import { User } from '../mockData/usersMockData';
import { v4 as uuidv4 } from 'uuid';

// Utility function to validate user creation
export const validateNewUser = (
  users: User[], 
  userData: Omit<User, 'id' | 'createdAt'>
): string | null => {
  // Check if username already exists
  if (users.some(user => user.username === userData.username)) {
    return 'El nombre de usuario ya existe';
  }
  
  // Check if email already exists
  if (users.some(user => user.email === userData.email)) {
    return 'El correo electrónico ya está registrado';
  }
  
  return null;
};

// Utility function to validate user updates
export const validateUserUpdate = (
  users: User[], 
  userId: string, 
  updates: Partial<User>
): string | null => {
  // If username is being updated, check it doesn't conflict
  if (updates.username) {
    const existingUser = users.find(
      user => user.username === updates.username && user.id !== userId
    );
    
    if (existingUser) {
      return 'El nombre de usuario ya existe';
    }
  }
  
  // If email is being updated, check it doesn't conflict
  if (updates.email) {
    const existingUser = users.find(
      user => user.email === updates.email && user.id !== userId
    );
    
    if (existingUser) {
      return 'El correo electrónico ya está registrado';
    }
  }
  
  return null;
};

// Function to create a new user
export const createUserHelper = (
  users: User[], 
  userData: Omit<User, 'id' | 'createdAt'>
): User => {
  const newUser: User = {
    ...userData,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  
  return newUser;
};
