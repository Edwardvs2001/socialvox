
import { AuthLayout } from '@/components/layout/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';

export default function Login() {
  return (
    <AuthLayout requiresAuth={false}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background via-blue-50 to-red-50 p-4">
        <div className="w-full max-w-md mx-auto">
          <div className="glass-panel rounded-t-2xl flex flex-col items-center pt-8 px-8 pb-4 border-b-0">
            <img 
              src="/lovable-uploads/08d8d744-0c91-48a2-a3af-c5f3ce5d78c5.png" 
              alt="Encuestas VA Logo" 
              className="w-28 h-28 mx-auto mb-4 animate-scale-in"
            />
            <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
              Encuestas VA
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-red-500 rounded-full mt-1"></div>
          </div>
          <div className="login-form-container">
            <LoginForm />
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
