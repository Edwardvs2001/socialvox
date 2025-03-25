
import { AuthLayout } from '@/components/layout/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';

export default function Login() {
  return (
    <AuthLayout requiresAuth={false}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/10 p-4">
        <div className="w-full max-w-md mx-auto">
          <LoginForm />
        </div>
      </div>
    </AuthLayout>
  );
}
