
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-6xl font-bold mb-4 text-red-500">404</h1>
        <p className="text-2xl font-semibold text-gray-800 mb-4">Página no encontrada</p>
        <p className="text-gray-600 mb-6">
          La página "{location.pathname}" no existe o ha sido movida.
        </p>
        <div className="space-y-3">
          <Link 
            to="/" 
            className="block w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors font-medium"
          >
            Volver al inicio
          </Link>
          <Link 
            to={-1 as any} 
            className="block w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors font-medium"
          >
            Volver atrás
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
