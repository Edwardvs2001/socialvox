
import { useState, useEffect } from 'react';
import { useSurveyStore, SurveyResponse } from '@/store/surveyStore';
import { useUserStore } from '@/store/userStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2, PieChart as PieChartIcon, BarChart as BarChartIcon, FileText } from 'lucide-react';

interface SurveyResultsProps {
  surveyId: string;
}

export function SurveyResults({ surveyId }: SurveyResultsProps) {
  const { getSurveyById, getSurveyResponses, isLoading } = useSurveyStore();
  const { users } = useUserStore();
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  
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
  
  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-admin" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Resumen</span>
                <Badge>{responses.length} respuestas</Badge>
              </CardTitle>
              <CardDescription>
                Resultados generales de la encuesta
              </CardDescription>
            </CardHeader>
            <CardContent>
              {survey?.questions && survey.questions.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Seleccionar pregunta:</label>
                    <Select
                      value={selectedQuestion || ''}
                      onValueChange={setSelectedQuestion}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona una pregunta" />
                      </SelectTrigger>
                      <SelectContent>
                        {survey.questions.map(question => (
                          <SelectItem key={question.id} value={question.id}>
                            {question.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {responses.length > 0 ? (
                    <Tabs defaultValue="bar">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="bar" className="flex items-center">
                          <BarChartIcon className="h-4 w-4 mr-2" />
                          Gráfico de Barras
                        </TabsTrigger>
                        <TabsTrigger value="pie" className="flex items-center">
                          <PieChartIcon className="h-4 w-4 mr-2" />
                          Gráfico Circular
                        </TabsTrigger>
                        <TabsTrigger value="table" className="flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          Tabla
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="bar" className="pt-4">
                        <div className="h-80 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="count" fill="#8884d8" name="Respuestas" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="pie" className="pt-4">
                        <div className="h-80 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, value }) => `${name}: ${value}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="table" className="pt-4">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-muted border-b">
                                <th className="text-left py-2 px-3">Opción</th>
                                <th className="text-center py-2 px-3">Respuestas</th>
                                <th className="text-center py-2 px-3">Porcentaje</th>
                              </tr>
                            </thead>
                            <tbody>
                              {chartData.map((item, index) => (
                                <tr key={index} className="border-b">
                                  <td className="py-2 px-3">{item.name}</td>
                                  <td className="text-center py-2 px-3">{item.value}</td>
                                  <td className="text-center py-2 px-3">{getPercentage(item.value)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No hay respuestas para esta encuesta.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Esta encuesta no tiene preguntas definidas.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Respuestas Detalladas</CardTitle>
              <CardDescription>
                Lista de todas las respuestas recibidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {responses.length > 0 ? (
                <div className="space-y-4">
                  {responses.map((response, index) => (
                    <Card key={response.id} className="border-admin/20">
                      <CardHeader className="py-3">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>Respuesta #{index + 1}</span>
                          <Badge variant="outline">
                            {formatDate(response.completedAt)}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Encuestador: {getRespondentName(response.respondentId)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="py-2">
                        <ul className="space-y-2">
                          {survey?.questions.map(question => {
                            const answer = response.answers.find(
                              a => a.questionId === question.id
                            );
                            return (
                              <li key={question.id} className="border-b pb-2">
                                <p className="font-medium">{question.text}</p>
                                <p className={answer ? "mt-1" : "mt-1 text-muted-foreground italic"}>
                                  {answer ? answer.selectedOption : 'Sin respuesta'}
                                </p>
                              </li>
                            );
                          })}
                        </ul>
                        
                        {response.audioRecording && (
                          <div className="mt-4">
                            <p className="font-medium mb-2">Grabación de audio:</p>
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
                <div className="text-center py-8 text-muted-foreground">
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
