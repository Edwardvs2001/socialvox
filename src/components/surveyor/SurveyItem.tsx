
import { Link } from 'react-router-dom';
import { Survey, useSurveyStore } from '@/store/surveyStore';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, FileText, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { memo } from 'react';

interface SurveyItemProps {
  survey: Survey;
}

export const SurveyItem = memo(({ survey }: SurveyItemProps) => {
  const { folders } = useSurveyStore();
  
  // Get full folder path to display folder hierarchy
  const getFolderPath = (folderId: string | null): string => {
    if (!folderId) return '';
    
    const breadcrumb: string[] = [];
    let currentId = folderId;
    
    while (currentId) {
      const folder = folders.find(f => f.id === currentId);
      if (folder) {
        breadcrumb.unshift(folder.name);
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    
    return breadcrumb.join(' > ');
  };
  
  const folderPath = getFolderPath(survey.folderId);
  
  return (
    <Card className="overflow-hidden surveyor-card hover:border-surveyor/30 transition-all duration-300 hover:shadow-md scale-hover">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{survey.title}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {survey.description}
            </CardDescription>
            {folderPath && (
              <div className="mt-2 flex items-center">
                <FolderOpen className="h-3.5 w-3.5 text-surveyor mr-1" />
                <span className="text-xs text-surveyor font-medium">{folderPath}</span>
              </div>
            )}
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
          className="btn-surveyor relative z-10"
        >
          <Link to={`/surveyor/survey/${survey.id}`}>
            Completar
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
});

SurveyItem.displayName = 'SurveyItem';
