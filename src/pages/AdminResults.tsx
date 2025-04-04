
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SurveyResults } from '@/components/admin/SurveyResults';
import { useSurveyStore } from '@/store/surveyStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarDays, 
  Users,
  ClipboardList,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSurveyById, getSurveyResponses } = useSurveyStore();
  const [survey, setSurvey] = useState(id ? getSurveyById(id) : null);
  const [responses, setResponses] = useState(id ? getSurveyResponses(id) : []);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  // Initialize data
  useEffect(() => {
    if (id) {
      const surveyData = getSurveyById(id);
      const responsesData = getSurveyResponses(id);
      
      setSurvey(surveyData);
      setResponses(responsesData);
      
      // Simulate loading state for better UX
      const timer = setTimeout(() => setLoading(false), 300);
      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, [id, getSurveyById, getSurveyResponses]);
  
  // Redirect if survey doesn't exist
  useEffect(() => {
    if (!id) {
      console.error('No survey ID provided');
      toast.error('ID de encuesta no proporcionado');
      navigate('/admin/results');
      return;
    }
    
    if (!loading && !survey) {
      console.error('Survey not found with ID:', id);
      toast.error('Encuesta no encontrada');
      navigate('/admin/results');
    }
  }, [survey, navigate, loading, id]);

  if (loading) {
    return (
      <AuthLayout requiresAuth={true} allowedRoles={['admin', 'admin-manager']}>
        <AdminLayout
          title="Cargando resultados..."
          description="Por favor espere mientras se cargan los datos"
        >
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </AdminLayout>
      </AuthLayout>
    );
  }
  
  if (!survey) {
    return null; // This will be caught by the useEffect and redirect
  }
  
  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <AuthLayout requiresAuth={true} allowedRoles={['admin', 'admin-manager']}>
      <AdminLayout
        title={`Resultados: ${survey.title}`}
        description="Visualización detallada de los resultados de la encuesta"
        backButton={{
          label: "Volver a Resultados",
          to: "/admin/results"
        }}
      >
        <div className="space-y-6">
          {/* Survey Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Información de la Encuesta</span>
                <Badge variant={survey.isActive ? "default" : "secondary"}>
                  {survey.isActive ? "Activa" : "Inactiva"}
                </Badge>
              </CardTitle>
              <CardDescription>{survey.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Fecha de creación</p>
                    <p className="text-sm text-muted-foreground">{formatDate(survey.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <ClipboardList className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Número de preguntas</p>
                    <p className="text-sm text-muted-foreground">{survey.questions.length} preguntas</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Respuestas recibidas</p>
                    <p className="text-sm text-muted-foreground">{responses.length} respuestas</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Asignada a</p>
                    <p className="text-sm text-muted-foreground">
                      {survey.assignedTo.length > 0 
                        ? `${survey.assignedTo.length} encuestadores` 
                        : "No asignada"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Separator />

          {/* Survey Results Component */}
          {id && <SurveyResults surveyId={id} />}
        </div>
      </AdminLayout>
    </AuthLayout>
  );
}
