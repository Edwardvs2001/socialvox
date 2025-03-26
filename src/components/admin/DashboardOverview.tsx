
import { useEffect, useState, useRef } from 'react';
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
  const updateTimerRef = useRef(null);
  const [activeSurveys, setActiveSurveys] = useState(0);
  const [activeResponses, setActiveResponses] = useState(0);
  const [surveyors, setSurveyors] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  
  // Efecto para cargar datos iniciales y configurar actualizaciones periódicas
  useEffect(() => {
    // Immediate fetch on mount
    const loadData = async () => {
      await fetchSurveys();
      await fetchUsers();
    };
    
    loadData();
    
    // Set up periodic data refresh (every 10 seconds)
    updateTimerRef.current = setInterval(() => {
      loadData();
    }, 10000);
    
    return () => {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
      }
    };
  }, [fetchSurveys, fetchUsers]);
  
  // Update metrics when data changes
  useEffect(() => {
    // Filtrar solo las encuestas activas
    const activeSurveysList = surveys.filter(s => s.isActive);
    const activeSurveyIds = activeSurveysList.map(s => s.id);
    
    // Contar las respuestas solo de encuestas activas
    const activeResponsesList = responses ? 
      responses.filter(r => activeSurveyIds.includes(r.surveyId)) : 
      [];
    
    setActiveSurveys(activeSurveysList.length);
    setActiveResponses(activeResponsesList.length);
    setSurveyors(users.filter(u => u.role === 'surveyor' && u.active).length);
    
    // Calcular tasa de finalización con datos de encuestas activas
    if (activeResponsesList.length > 0 && activeSurveysList.length > 0) {
      // Esta es una fórmula genérica, ajustar según la lógica real de negocio
      const rate = Math.min(
        Math.round((activeResponsesList.length / (activeSurveysList.length * 3)) * 100),
        100
      );
      setCompletionRate(rate);
    } else {
      setCompletionRate(0);
    }
    
    setChartData(generateChartData(activeResponsesList));
  }, [surveys, responses, users]);
  
  function generateChartData(activeResponses = []) {
    const today = new Date();
    const data = [];
    
    // Usar datos reales si están disponibles
    if (activeResponses.length > 0) {
      // Agrupar respuestas por día para los últimos 7 días
      const last7Days = {};
      
      // Inicializar los últimos 7 días
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = formatDate(date);
        last7Days[dateStr] = 0;
      }
      
      // Contar respuestas por día
      activeResponses.forEach(response => {
        const responseDate = new Date(response.completedAt);
        const dateStr = formatDate(responseDate);
        
        // Solo contar si está dentro de los últimos 7 días
        if (last7Days[dateStr] !== undefined) {
          last7Days[dateStr]++;
        }
      });
      
      // Convertir a formato de datos para el gráfico
      Object.entries(last7Days).forEach(([date, value]) => {
        data.push({
          date,
          responses: value
        });
      });
    } else {
      // Si no hay datos reales, usar datos de ejemplo
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        data.push({
          date: formatDate(date),
          responses: Math.floor(Math.random() * 5), // Valores más pequeños para demo
        });
      }
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeResponses} respuestas de encuestas activas
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Activity chart */}
      <Card className="admin-card">
        <CardHeader>
          <CardTitle>Actividad de respuestas</CardTitle>
          <CardDescription>
            Respuestas de encuestas activas durante los últimos 7 días
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
                <Tooltip formatter={(value) => [`${value} respuestas`, 'Cantidad']} />
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
