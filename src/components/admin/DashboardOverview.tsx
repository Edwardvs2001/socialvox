
import { useEffect, useState } from 'react';
import { useSurveyStore } from '@/store/surveyStore';
import { useUserStore } from '@/store/userStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, ClipboardList, FileText, Users, Plus } from 'lucide-react';

export function DashboardOverview() {
  const { surveys, responses, fetchSurveys } = useSurveyStore();
  const { users, fetchUsers } = useUserStore();
  const [chartData, setChartData] = useState([]);
  
  // Efecto para cargar datos iniciales
  useEffect(() => {
    fetchSurveys();
    fetchUsers();
  }, [fetchSurveys, fetchUsers]);
  
  // Efecto para actualizar los datos del gráfico cuando cambian las respuestas
  useEffect(() => {
    setChartData(generateChartData());
  }, [responses]);
  
  // Count active surveys
  const activeSurveys = surveys.filter(s => s.isActive).length;
  
  // Count surveyors
  const surveyors = users.filter(u => u.role === 'surveyor' && u.active).length;
  
  function generateChartData() {
    const today = new Date();
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: formatDate(date),
        responses: Math.floor(Math.random() * 10) + 1, // Random data for demo
      });
    }
    
    return data;
  }
  
  function formatDate(date: Date) {
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Panel de Control</h2>
        <Button asChild className="btn-admin">
          <Link to="/admin/surveys/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Encuesta
          </Link>
        </Button>
      </div>
      
      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="admin-card hover:border-admin/30 transition-all duration-300 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Encuestas activas
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-admin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSurveys}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {surveys.length} encuestas en total
            </p>
          </CardContent>
        </Card>
        
        <Card className="admin-card hover:border-admin/30 transition-all duration-300 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Respuestas recibidas
            </CardTitle>
            <FileText className="h-4 w-4 text-admin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responses.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Desde el inicio
            </p>
          </CardContent>
        </Card>
        
        <Card className="admin-card hover:border-admin/30 transition-all duration-300 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Encuestadores activos
            </CardTitle>
            <Users className="h-4 w-4 text-admin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{surveyors}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {users.filter(u => u.role === 'surveyor').length} encuestadores en total
            </p>
          </CardContent>
        </Card>
        
        <Card className="admin-card hover:border-admin/30 transition-all duration-300 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasa de finalización
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-admin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Últimos 30 días
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Activity chart */}
      <Card className="admin-card">
        <CardHeader>
          <CardTitle>Actividad de respuestas</CardTitle>
          <CardDescription>
            Respuestas recibidas durante los últimos 7 días
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="responses" 
                  stroke="hsl(0, 84%, 50%)" 
                  fill="hsl(0, 84%, 95%)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="admin-card hover:border-admin/30 transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Gestionar Encuestas</CardTitle>
            <CardDescription>
              Crear, editar o eliminar encuestas
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/surveys">
                <ClipboardList className="mr-2 h-4 w-4" />
                Ver encuestas
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="admin-card hover:border-admin/30 transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Ver Resultados</CardTitle>
            <CardDescription>
              Analizar respuestas y escuchar grabaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/results">
                <BarChart3 className="mr-2 h-4 w-4" />
                Ver resultados
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="admin-card hover:border-admin/30 transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Gestionar Usuarios</CardTitle>
            <CardDescription>
              Administrar encuestadores y administradores
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Ver usuarios
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
