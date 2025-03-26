
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SurveyorLayout } from '@/components/layout/SurveyorLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Survey, useSurveyStore } from '@/store/surveyStore';
import { SurveyForm } from '@/components/surveyor/SurveyForm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChevronLeft, Loader2, AlertTriangle } from 'lucide-react';

export default function SurveyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getSurveyById, isLoading } = useSurveyStore();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [locationSupported, setLocationSupported] = useState(true);
  
  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setLocationSupported(false);
    }
    
    if (id) {
      const foundSurvey = getSurveyById(id);
      
      if (foundSurvey) {
        setSurvey(foundSurvey);
      } else {
        setNotFound(true);
      }
    }
  }, [id, getSurveyById]);
  
  if (isLoading) {
    return (
      <AuthLayout requiresAuth={true} allowedRoles={['surveyor']}>
        <SurveyorLayout>
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-surveyor" />
          </div>
        </SurveyorLayout>
      </AuthLayout>
    );
  }
  
  if (notFound || !survey) {
    return (
      <AuthLayout requiresAuth={true} allowedRoles={['surveyor']}>
        <SurveyorLayout>
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold mb-4">Encuesta no encontrada</h2>
            <p className="text-muted-foreground mb-6">
              La encuesta que estás buscando no existe o no tienes acceso a ella.
            </p>
            <Button 
              onClick={() => navigate('/surveyor')}
              className="btn-surveyor"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Volver a mis encuestas
            </Button>
          </div>
        </SurveyorLayout>
      </AuthLayout>
    );
  }
  
  return (
    <AuthLayout requiresAuth={true} allowedRoles={['surveyor']}>
      <SurveyorLayout
        title={survey.title}
        description={survey.description}
      >
        <Button 
          variant="outline" 
          onClick={() => navigate('/surveyor')}
          className="mb-6"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Volver a mis encuestas
        </Button>
        
        {!locationSupported && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Ubicación no disponible</AlertTitle>
            <AlertDescription>
              Tu dispositivo no soporta la geolocalización. Esta funcionalidad es necesaria para completar la encuesta.
            </AlertDescription>
          </Alert>
        )}
        
        <SurveyForm survey={survey} />
      </SurveyorLayout>
    </AuthLayout>
  );
}
