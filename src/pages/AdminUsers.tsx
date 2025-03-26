
import { useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { UserManager } from '@/components/admin/UserManager';
import { useUserStore } from '@/store/userStore';
import { supabase } from '@/integrations/supabase/client';

export default function AdminUsers() {
  const { fetchUsers } = useUserStore();
  
  // Fetch users when the component mounts
  useEffect(() => {
    fetchUsers();
    
    // We create an admin user if one doesn't exist yet
    // This ensures there's always at least one admin in the system
    const createInitialAdmin = async () => {
      try {
        // Check if admin exists
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', 'admin')
          .eq('role', 'admin');
        
        if (!data || data.length === 0) {
          // Create admin user through the API
          const { error } = await supabase.auth.admin.createUser({
            email: 'admin@encuestasva.com',
            password: 'Admin@2024!',
            email_confirm: true,
            user_metadata: {
              username: 'admin',
              name: 'Administrador',
              role: 'admin',
            }
          });
          
          if (error) {
            console.error('Error creating admin user:', error);
            return;
          }
          
          // Refresh users list
          fetchUsers();
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
