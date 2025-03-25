
import { Link } from 'react-router-dom';
import { Survey } from '@/store/surveyStore';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/api';
import { ChevronRight, FileText } from 'lucide-react';

interface SurveyItemProps {
  survey: Survey;
}

export function SurveyItem({ survey }: SurveyItemProps) {
  return (
    <Card className="overflow-hidden surveyor-card hover:border-surveyor/30 transition-all duration-300 hover:shadow-md scale-hover">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{survey.title}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {survey.description}
            </CardDescription>
          </div>
          <FileText className="h-5 w-5 text-surveyor" />
        </div>
      </CardHeader>
      <CardFooter className="pt-4 pb-4 flex justify-between items-center border-t">
        <div className="text-xs text-muted-foreground">
          {survey.questions.length} {survey.questions.length === 1 ? 'pregunta' : 'preguntas'}
        </div>
        <Button 
          asChild 
          size="sm" 
          className="btn-surveyor"
        >
          <Link to={`/surveyor/survey/${survey.id}`}>
            Completar
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
