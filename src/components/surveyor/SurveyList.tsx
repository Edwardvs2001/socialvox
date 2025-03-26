
import { useEffect, useState } from 'react';
import { useSurveyStore } from '@/store/surveyStore';
import { useAuthStore } from '@/store/authStore';
import { ClipboardList, FolderOpen, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SurveyItem } from './SurveyItem';

export function SurveyList() {
  const { user } = useAuthStore();
  const { surveys, folders, fetchSurveys, isLoading } = useSurveyStore();
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Filter surveys assigned to the current surveyor
  const assignedSurveys = surveys.filter(
    survey => survey.assignedTo.includes(user?.id || '') && survey.isActive
  );
  
  // Group surveys by folder
  const surveysByFolder = assignedSurveys.reduce((acc, survey) => {
    const folderId = survey.folderId || 'unassigned';
    if (!acc[folderId]) {
      acc[folderId] = [];
    }
    acc[folderId].push(survey);
    return acc;
  }, {} as Record<string, typeof assignedSurveys>);
  
  // Get list of folders with assigned surveys
  const assignedFolders = folders.filter(
    folder => assignedSurveys.some(survey => survey.folderId === folder.id)
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
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todas</TabsTrigger>
          {assignedFolders.map(folder => (
            <TabsTrigger key={folder.id} value={folder.id}>
              {folder.name}
            </TabsTrigger>
          ))}
          {surveysByFolder['unassigned']?.length > 0 && (
            <TabsTrigger value="unassigned">Sin carpeta</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="all">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {assignedSurveys.map(survey => (
              <SurveyItem key={survey.id} survey={survey} />
            ))}
          </div>
        </TabsContent>
        
        {assignedFolders.map(folder => (
          <TabsContent key={folder.id} value={folder.id}>
            <div className="mb-4">
              <h3 className="flex items-center text-lg font-medium">
                <FolderOpen className="mr-2 h-5 w-5 text-surveyor" />
                {folder.name}
              </h3>
              <p className="text-sm text-muted-foreground">{folder.description}</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {surveysByFolder[folder.id]?.map(survey => (
                <SurveyItem key={survey.id} survey={survey} />
              ))}
            </div>
          </TabsContent>
        ))}
        
        {surveysByFolder['unassigned']?.length > 0 && (
          <TabsContent value="unassigned">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Encuestas sin carpeta</h3>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {surveysByFolder['unassigned']?.map(survey => (
                <SurveyItem key={survey.id} survey={survey} />
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
