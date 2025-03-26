
import { useState, useEffect } from 'react';
import { useSurveyStore, SurveyResponse } from '@/store/surveyStore';
import { useUserStore } from '@/store/userStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2, PieChartIcon, BarChartIcon, FileText, Download, FileAudio } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { exportResultsToCSV, exportAudioRecordings } from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';

interface SurveyResultsProps {
  surveyId: string;
  onLowAccuracy?: (hasLowAccuracy: boolean) => void;
}

export function SurveyResults({ surveyId, onLowAccuracy }: SurveyResultsProps) {
  const { getSurveyById, getSurveyResponses, isLoading } = useSurveyStore();
  const { users } = useUserStore();
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const survey = getSurveyById(surveyId);
  const responses = getSurveyResponses(surveyId);
  
  useEffect(() => {
    // Set the first question as selected by default
    if (survey && survey.questions.length > 0 && !selectedQuestion) {
      setSelectedQuestion(survey.questions[0].id);
    }
  }, [survey, selectedQuestion]);
  
  // Get the respondent name from their ID
  const getRespondentName = (id: string) => {
    const user = users.find(u => u.id === id);
    return user ? user.name : 'Usuario desconocido';
  };
  
  // Process responses for charts
  const processChartData = () => {
    if (!survey || !selectedQuestion) return [];
    
    const question = survey.questions.find(q => q.id === selectedQuestion);
    if (!question) return [];
    
    // For free-text questions, we can't show charts
    if (question.type === 'free-text') return [];
    
    // Initialize counts for each option
    const counts: Record<string, number> = {};
    question.options.forEach(option => {
      counts[option] = 0;
    });
    
    // Count responses for each option
    responses.forEach(response => {
      const answer = response.answers.find(a => a.questionId === selectedQuestion);
      if (answer) {
        counts[answer.selectedOption] = (counts[answer.selectedOption] || 0) + 1;
      }
    });
    
    // Convert to chart data format
    return Object.entries(counts).map(([option, count]) => ({
      name: option,
      value: count,
      count: count,
    }));
  };
  
  const chartData = processChartData();
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC0CB', '#A569BD'];
  
  const getPercentage = (value: number) => {
    if (responses.length === 0) return '0%';
    return `${Math.round((value / responses.length) * 100)}%`;
  };
  
  // Handle exporting survey results
  const handleExportResults = () => {
    if (!survey) return;
    
    try {
      exportResultsToCSV(survey, responses);
      toast({
        title: "Exportación exitosa",
        description: "Los resultados se han descargado como un archivo CSV.",
      });
    } catch (error) {
      console.error('Error exporting results:', error);
      toast({
        title: "Error al exportar",
        description: "No se pudieron exportar los resultados. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };
  
  // Handle exporting audio recordings
  const handleExportAudio = async () => {
    if (!survey) return;
    
    // Check if there are any recordings to export
    const hasRecordings = responses.some(r => r.audioRecording);
    if (!hasRecordings) {
      toast({
        title: "Sin grabaciones",
        description: "No hay grabaciones de audio para exportar en esta encuesta.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await exportAudioRecordings(survey, responses);
      toast({
        title: "Exportación exitosa",
        description: "Las grabaciones de audio se han descargado.",
      });
    } catch (error) {
      console.error('Error exporting audio recordings:', error);
      toast({
        title: "Error al exportar",
        description: "No se pudieron exportar las grabaciones. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };
  
  // Call onLowAccuracy callback if needed
  useEffect(() => {
    if (onLowAccuracy) {
      onLowAccuracy(false);
    }
  }, [onLowAccuracy]);
  
  // Check if the selected question is free-text
  const isSelectedQuestionFreeText = () => {
    if (!survey || !selectedQuestion) return false;
    const question = survey.questions.find(q => q.id === selectedQuestion);
    return question?.type === 'free-text';
  };
  
  return (
    <div className="space-y-4 md:space-y-6">
      {isLoading ? (
        <div className="flex justify-center items-center py-6 md:py-12">
          <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-admin" />
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className={`${isMobile ? "text-lg" : "text-xl"} font-semibold`}>
              {responses.length} {responses.length === 1 ? 'respuesta' : 'respuestas'} recibidas
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size={isMobile ? "sm" : "default"}
                onClick={handleExportResults}
                className="flex items-center gap-1"
              >
                <Download className={`${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
                <span>{isMobile ? "Exportar CSV" : "Exportar Resultados"}</span>
              </Button>
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                onClick={handleExportAudio}
                className="flex items-center gap-1"
              >
                <FileAudio className={`${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
                <span>{isMobile ? "Exportar Audio" : "Exportar Grabaciones"}</span>
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader className={isMobile ? "py-3" : "py-4"}>
              <CardTitle className={`flex items-center justify-between ${isMobile ? "text-lg" : "text-xl"}`}>
                <span>Resumen</span>
              </CardTitle>
              <CardDescription className={isMobile ? "text-xs" : "text-sm"}>
                Resultados generales de la encuesta
              </CardDescription>
            </CardHeader>
            <CardContent className={isMobile ? "p-3" : "p-6"}>
              {survey?.questions && survey.questions.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className={`${isMobile ? "text-xs" : "text-sm"} font-medium`}>Seleccionar pregunta:</label>
                    <Select
                      value={selectedQuestion || ''}
                      onValueChange={setSelectedQuestion}
                    >
                      <SelectTrigger className={`w-full ${isMobile ? "text-xs mt-1" : "text-sm mt-2"}`}>
                        <SelectValue placeholder="Selecciona una pregunta" />
                      </SelectTrigger>
                      <SelectContent>
                        {survey.questions.map(question => (
                          <SelectItem key={question.id} value={question.id} className={isMobile ? "text-xs" : "text-sm"}>
                            {question.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {responses.length > 0 ? (
                    isSelectedQuestionFreeText() ? (
                      <div className={`text-center py-4 md:py-8 ${isMobile ? "text-xs" : "text-sm"} text-muted-foreground`}>
                        <p>Las preguntas de texto libre no se pueden visualizar en gráficos.</p>
                      </div>
                    ) : (
                      <Tabs defaultValue="bar">
                        <TabsList className={`grid w-full grid-cols-3 ${isMobile ? "text-xs" : "text-sm"}`}>
                          <TabsTrigger value="bar" className="flex items-center">
                            <BarChartIcon className={`${isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"}`} />
                            {isMobile ? "Barras" : "Gráfico de Barras"}
                          </TabsTrigger>
                          <TabsTrigger value="pie" className="flex items-center">
                            <PieChartIcon className={`${isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"}`} />
                            {isMobile ? "Circular" : "Gráfico Circular"}
                          </TabsTrigger>
                          <TabsTrigger value="table" className="flex items-center">
                            <FileText className={`${isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"}`} />
                            Tabla
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="bar" className="pt-3 md:pt-4">
                          <div className={`${isMobile ? "h-60" : "h-80"} w-full`}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData} margin={isMobile ? { top: 5, right: 5, bottom: 5, left: 5 } : { top: 20, right: 30, bottom: 5, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} />
                                <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                                <Tooltip contentStyle={{ fontSize: isMobile ? 10 : 12 }} />
                                <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                                <Bar dataKey="count" fill="#8884d8" name="Respuestas" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="pie" className="pt-3 md:pt-4">
                          <div className={`${isMobile ? "h-60" : "h-80"} w-full`}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart margin={isMobile ? { top: 5, right: 5, bottom: 5, left: 5 } : { top: 20, right: 30, bottom: 5, left: 20 }}>
                                <Pie
                                  data={chartData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={!isMobile}
                                  label={isMobile ? undefined : ({ name, value }) => `${name}: ${value}`}
                                  outerRadius={isMobile ? 60 : 80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {chartData.map((entry, index) =>
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  )}
                                </Pie>
                                <Tooltip contentStyle={{ fontSize: isMobile ? 10 : 12 }} />
                                <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="table" className="pt-3 md:pt-4">
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-muted border-b">
                                  <th className={`text-left py-1 px-2 md:py-2 md:px-3 ${isMobile ? "text-xs" : "text-sm"}`}>Opción</th>
                                  <th className={`text-center py-1 px-2 md:py-2 md:px-3 ${isMobile ? "text-xs" : "text-sm"}`}>Respuestas</th>
                                  <th className={`text-center py-1 px-2 md:py-2 md:px-3 ${isMobile ? "text-xs" : "text-sm"}`}>Porcentaje</th>
                                </tr>
                              </thead>
                              <tbody>
                                {chartData.map((item, index) => (
                                  <tr key={index} className="border-b">
                                    <td className={`py-1 px-2 md:py-2 md:px-3 ${isMobile ? "text-xs" : "text-sm"}`}>{item.name}</td>
                                    <td className={`text-center py-1 px-2 md:py-2 md:px-3 ${isMobile ? "text-xs" : "text-sm"}`}>{item.value}</td>
                                    <td className={`text-center py-1 px-2 md:py-2 md:px-3 ${isMobile ? "text-xs" : "text-sm"}`}>{getPercentage(item.value)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </TabsContent>
                      </Tabs>
                    )
                  ) : (
                    <div className={`text-center py-4 md:py-8 ${isMobile ? "text-xs" : "text-sm"} text-muted-foreground`}>
                      <p>No hay respuestas para esta encuesta.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`text-center py-4 md:py-8 ${isMobile ? "text-xs" : "text-sm"} text-muted-foreground`}>
                  <p>Esta encuesta no tiene preguntas definidas.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className={isMobile ? "py-3" : "py-4"}>
              <CardTitle className={isMobile ? "text-lg" : "text-xl"}>Respuestas Detalladas</CardTitle>
              <CardDescription className={isMobile ? "text-xs" : "text-sm"}>
                Lista de todas las respuestas recibidas
              </CardDescription>
            </CardHeader>
            <CardContent className={isMobile ? "p-3" : "p-6"}>
              {responses.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  {responses.map((response, index) => (
                    <Card key={response.id} className="border-admin/20">
                      <CardHeader className={`${isMobile ? "py-2 px-3" : "py-3 px-4"}`}>
                        <CardTitle className={`${isMobile ? "text-sm" : "text-base"} flex items-center justify-between`}>
                          <span>Respuesta #{index + 1}</span>
                          <Badge variant="outline" className={isMobile ? "text-xs" : "text-sm"}>
                            {formatDate(response.completedAt)}
                          </Badge>
                        </CardTitle>
                        <CardDescription className={isMobile ? "text-xs" : "text-sm"}>
                          Encuestador: {getRespondentName(response.respondentId)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className={`${isMobile ? "py-2 px-3" : "py-2 px-4"}`}>
                        <ul className="space-y-2">
                          {survey?.questions.map(question => {
                            const answer = response.answers.find(
                              a => a.questionId === question.id
                            );
                            return (
                              <li key={question.id} className="border-b pb-2">
                                <p className={`${isMobile ? "text-xs" : "text-sm"} font-medium`}>{question.text}</p>
                                <p className={`${isMobile ? "text-xs" : "text-sm"} ${answer ? "mt-1" : "mt-1 text-muted-foreground italic"}`}>
                                  {answer ? answer.selectedOption : 'Sin respuesta'}
                                </p>
                              </li>
                            );
                          })}
                        </ul>
                        
                        {response.audioRecording && (
                          <div className="mt-3 md:mt-4">
                            <p className={`${isMobile ? "text-xs" : "text-sm"} font-medium mb-1 md:mb-2`}>Grabación de audio:</p>
                            <audio controls className="w-full">
                              <source src={response.audioRecording} type="audio/webm" />
                              Tu navegador no soporta el elemento de audio.
                            </audio>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-4 md:py-8 ${isMobile ? "text-xs" : "text-sm"} text-muted-foreground`}>
                  <p>No hay respuestas disponibles para esta encuesta.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

