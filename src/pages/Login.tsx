
import { AuthLayout } from '@/components/layout/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';

export default function Login() {
  return (
    <AuthLayout requiresAuth={false}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-900 via-blue-700 to-red-700 p-4 overflow-hidden relative">
        {/* Background decorative elements */}
        <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full -top-20 -left-20 blur-3xl"></div>
        <div className="absolute w-96 h-96 bg-red-500/20 rounded-full -bottom-20 -right-20 blur-3xl"></div>
        <div className="absolute w-72 h-72 bg-yellow-500/10 rounded-full top-1/4 right-1/4 blur-2xl animate-pulse-subtle"></div>
        
        {/* Login container with 3D effect */}
        <div className="w-full max-w-md mx-auto relative z-10 perspective-1000">
          <div className="logo-panel rounded-t-2xl flex flex-col items-center pt-10 px-8 pb-6 border-b-0 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-lg border border-white/20 shadow-[0_10px_50px_rgba(0,0,0,0.3)] transform-style-3d rotate-x-2">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-t-2xl"></div>
            <div className="relative z-10">
              <div className="w-28 h-28 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-600/80 to-red-600/80 p-1 shadow-lg mb-4 rotate-scale">
                <img 
                  src="/lovable-uploads/08d8d744-0c91-48a2-a3af-c5f3ce5d78c5.png" 
                  alt="Encuestas VA Logo" 
                  className="w-full h-full object-contain p-2 animate-scale-in"
                />
              </div>
              <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-200 to-red-200 bg-clip-text text-transparent drop-shadow-md">
                Encuestas VA
              </h1>
              <div className="w-40 h-1 bg-gradient-to-r from-blue-400 to-red-400 rounded-full mt-2 shadow-sm"></div>
            </div>
          </div>
          <div className="login-form-container transform-gpu">
            <LoginForm />
          </div>
        </div>
        
        {/* Additional 3D elements */}
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-gradient-to-tr from-blue-600/10 to-transparent rotate-45 rounded-3xl blur-xl"></div>
        <div className="absolute top-20 right-20 w-40 h-40 bg-gradient-to-bl from-red-600/10 to-transparent -rotate-12 rounded-3xl blur-xl"></div>
      </div>
    </AuthLayout>
  );
}
