
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  ClipboardList,
  Settings
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSurveyStore } from '@/store/surveyStore';
import { useUserStore } from '@/store/userStore';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { surveys, responses, fetchSurveys } = useSurveyStore();
  const { users, fetchUsers } = useUserStore();
  const [activeSurveys, setActiveSurveys] = useState(0);
  const [surveyors, setSurveyors] = useState(0);
  const [surveyCount, setSurveyCount] = useState(0);
  const [activeResponseCount, setActiveResponseCount] = useState(0);
  
  // Fetch data on component mount and when admin page is visited
  useEffect(() => {
    // Immediate data fetch
    const fetchData = async () => {
      await fetchSurveys();
      await fetchUsers();
    };
    
    fetchData();
    
    // Set up an interval to periodically refresh data (every 15 seconds)
    const refreshInterval = setInterval(() => {
      fetchData();
    }, 15000);
    
    return () => clearInterval(refreshInterval);
  }, [fetchSurveys, fetchUsers]);
  
  // Update counts whenever surveys, responses, or users change
  useEffect(() => {
    // Filter only active surveys
    const activeSurveysList = surveys.filter(s => s.isActive);
    const activeSurveyIds = activeSurveysList.map(s => s.id);
    
    // Count responses only from active surveys
    const activeResponses = responses ? 
      responses.filter(r => activeSurveyIds.includes(r.surveyId)) : 
      [];
    
    setSurveyCount(surveys.length);
    setActiveSurveys(activeSurveysList.length);
    setActiveResponseCount(activeResponses.length);
    setSurveyors(users.filter(u => u.role === 'surveyor' && u.active).length);
  }, [surveys, responses, users]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Admin menu cards */}
        <Card className="hover:shadow-md transition-all duration-300 bg-white border-admin/20 hover:border-admin/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <div className="flex items-center">
                <ClipboardList className="mr-2 h-5 w-5 text-admin" />
                Encuestas
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Gestiona todas las encuestas activas e inactivas. Crea nuevas encuestas y revisa los resultados.
            </p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">{surveyCount}</span>
              <Button onClick={() => navigate('/admin/surveys')} className="bg-admin hover:bg-admin/90">
                Administrar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300 bg-white border-admin/20 hover:border-admin/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <BarChart3 className="mr-2 h-5 w-5 text-admin" />
              Resultados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Visualiza y analiza los resultados de todas las encuestas. Revisa las respuestas recopiladas.
            </p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">{activeResponseCount}</span>
              <Button onClick={() => navigate('/admin/results')} className="bg-admin hover:bg-admin/90">
                Ver Datos
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300 bg-white border-admin/20 hover:border-admin/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Users className="mr-2 h-5 w-5 text-admin" />
              Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Administra los usuarios, asigna roles y gestiona los permisos de acceso al sistema.
            </p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">{users.length}</span>
              <Button onClick={() => navigate('/admin/users')} className="bg-admin hover:bg-admin/90">
                Gestionar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <ClipboardList className="h-8 w-8 text-admin mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Encuestas Activas</p>
              <h3 className="text-2xl font-bold mt-1">{activeSurveys}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Users className="h-8 w-8 text-admin mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Encuestadores</p>
              <h3 className="text-2xl font-bold mt-1">{surveyors}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <BarChart3 className="h-8 w-8 text-admin mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Respuestas</p>
              <h3 className="text-2xl font-bold mt-1">{activeResponseCount}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Settings className="h-8 w-8 text-admin mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Configuración</p>
              <Button variant="ghost" className="mt-1" onClick={() => navigate('/admin/settings')}>
                Ajustes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
