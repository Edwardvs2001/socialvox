
import { useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { UserManager } from '@/components/admin/UserManager';
import { useUserStore } from '@/store/userStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdminUsers() {
  const { fetchUsers } = useUserStore();
  
  // Fetch users when the component mounts
  useEffect(() => {
    fetchUsers();
    
    // We create an admin user if one doesn't exist yet
    // This ensures there's always at least one admin in the system
    const createInitialAdmin = async () => {
      try {
        console.log('Checking if admin user exists...');
        // Check if admin exists
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', 'admin')
          .eq('role', 'admin');
        
        if (queryError) {
          console.error('Error checking for admin:', queryError);
          return;
        }
        
        if (!data || data.length === 0) {
          console.log('Admin user not found, creating admin user...');
          
          // Create admin user through Auth API
          const { data: userData, error: authError } = await supabase.auth.signUp({
            email: 'admin@encuestasva.com',
            password: 'Admin@2024!',
            options: {
              data: {
                username: 'admin',
                name: 'Administrador',
                role: 'admin',
              }
            }
          });
          
          if (authError) {
            console.error('Error creating admin user:', authError);
            toast.error('No se pudo crear el usuario administrador');
            return;
          }
          
          // Wait a moment for the trigger to create the profile
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Update user profile with admin role (in case trigger doesn't set it)
          if (userData.user) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ 
                role: 'admin',
                active: true,
                username: 'admin',
                name: 'Administrador'
              })
              .eq('id', userData.user.id);
            
            if (updateError) {
              console.error('Error updating admin profile:', updateError);
            }
          }
          
          console.log('Admin user created successfully');
          toast.success('Usuario admin creado correctamente');
          
          // Refresh users list
          fetchUsers();
        } else {
          console.log('Admin user already exists');
        }
      } catch (error) {
        console.error('Error checking/creating admin:', error);
      }
    };
    
    createInitialAdmin();
  }, [fetchUsers]);
  
  return (
    <AuthLayout requiresAuth={true} allowedRoles={['admin', 'admin-manager']}>
      <AdminLayout
        title="Gestión de Usuarios"
        description="Crear y administrar usuarios encuestadores"
      >
        <UserManager />
      </AdminLayout>
    </AuthLayout>
  );
}
