
import { AuthLayout } from '@/components/layout/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';

export default function Login() {
  return (
    <AuthLayout requiresAuth={false}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background via-blue-50 to-red-50 p-4">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-6">
            <img 
              src="/lovable-uploads/08d8d744-0c91-48a2-a3af-c5f3ce5d78c5.png" 
              alt="Encuestas VA Logo" 
              className="w-32 h-32 mx-auto mb-4 animate-scale-in"
            />
          </div>
          <LoginForm />
        </div>
      </div>
    </AuthLayout>
  );
}
