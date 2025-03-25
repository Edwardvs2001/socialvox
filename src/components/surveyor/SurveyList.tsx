
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSurveyStore } from '@/store/surveyStore';
import { useAuthStore } from '@/store/authStore';
import { ClipboardList, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { formatDate } from '@/utils/api';
import { SurveyItem } from './SurveyItem';

export function SurveyList() {
  const { user } = useAuthStore();
  const { surveys, fetchSurveys, isLoading } = useSurveyStore();
  
  // Filter surveys assigned to the current surveyor
  const assignedSurveys = surveys.filter(
    survey => survey.assignedTo.includes(user?.id || '') && survey.isActive
  );
  
  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-8 h-8 animate-spin text-surveyor" />
      </div>
    );
  }
  
  if (assignedSurveys.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="flex flex-col items-center justify-center pt-10 pb-10">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No hay encuestas asignadas en este momento.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {assignedSurveys.map(survey => (
        <SurveyItem key={survey.id} survey={survey} />
      ))}
    </div>
  );
}
