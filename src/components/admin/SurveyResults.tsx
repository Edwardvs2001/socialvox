
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie, Legend } from 'recharts';
import { useSurveyStore } from '@/store/surveyStore';
import { Button } from '@/components/ui/button';
import { DownloadIcon, Mic, FileSpreadsheet, FileText } from 'lucide-react';
import { exportResultsToCSV, exportResultsToExcel, exportAudioRecordings } from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function SurveyResults({ surveyId }: { surveyId: string }) {
  const { surveys, getSurveyById, getSurveyResponses } = useSurveyStore();
  const survey = getSurveyById(surveyId);
  const responses = getSurveyResponses(surveyId);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Compute statistics and data
  const statsData = useMemo(() => {
    if (!survey) return { totalResponses: 0 };
    
    const totalResponses = responses.length;
    const hasAudioCount = responses.filter(r => r.audioRecording).length;
    
    return {
      totalResponses,
      hasAudioCount,
      audioPercentage: totalResponses ? Math.round((hasAudioCount / totalResponses) * 100) : 0
    };
  }, [survey, responses]);
  
  // Generate charts data for each question
  const questionsData = useMemo(() => {
    if (!survey) return [];
    
    return survey.questions.map(question => {
      if (question.type === 'multiple-choice') {
        // For multiple choice, count occurrences of each option
        const optionCounts = question.options.reduce((acc, option) => {
          acc[option] = 0;
          return acc;
        }, {} as Record<string, number>);
        
        responses.forEach(response => {
          const answer = response.answers.find(a => a.questionId === question.id);
          if (answer && answer.selectedOption) {
            optionCounts[answer.selectedOption] = (optionCounts[answer.selectedOption] || 0) + 1;
          }
        });
        
        return {
          id: question.id,
          text: question.text,
          type: question.type,
          data: Object.entries(optionCounts).map(([name, value]) => ({ 
            name, 
            value,
            percentage: responses.length ? Math.round((value / responses.length) * 100) : 0
          }))
        };
      } else if (question.type === 'free-text') {
        // For free-text, collect all answers
        const textAnswers = responses
          .map(response => {
            const answer = response.answers.find(a => a.questionId === question.id);
            return answer?.textAnswer || null;
          })
          .filter(Boolean) as string[];
        
        return {
          id: question.id,
          text: question.text,
          type: question.type,
          answers: textAnswers
        };
      }
      
      return null;
    }).filter(Boolean);
  }, [survey, responses]);
  
  const handleExportCSV = () => {
    if (!survey) return;
    
    try {
      exportResultsToCSV(survey, responses);
      toast({
        title: "Exportación exitosa",
        description: "Los resultados se han exportado en formato CSV."
      });
    } catch (error) {
      toast({
        title: "Error en la exportación",
        description: "No se pudieron exportar los resultados.",
        variant: "destructive"
      });
      console.error("Export error:", error);
    }
  };
  
  const handleExportExcel = () => {
    if (!survey) return;
    
    try {
      exportResultsToExcel(survey, responses);
      toast({
        title: "Exportación exitosa",
        description: "Los resultados se han exportado en formato Excel."
      });
    } catch (error) {
      toast({
        title: "Error en la exportación",
        description: "No se pudieron exportar los resultados.",
        variant: "destructive"
      });
      console.error("Export error:", error);
    }
  };
  
  const handleExportAudio = async () => {
    if (!survey) return;
    
    try {
      await exportAudioRecordings(survey, responses);
      toast({
        title: "Exportación exitosa",
        description: "Las grabaciones de audio se han exportado."
      });
    } catch (error) {
      toast({
        title: "Error en la exportación",
        description: "No se pudieron exportar las grabaciones de audio.",
        variant: "destructive"
      });
      console.error("Audio export error:", error);
    }
  };
  
  if (!survey) {
    return <div>Encuesta no encontrada</div>;
  }
  
  const hasAudioRecordings = responses.some(r => r.audioRecording);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Resumen de Respuestas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.totalResponses}</div>
            <p className="text-xs text-muted-foreground">Total de respuestas recopiladas</p>
          </CardContent>
        </Card>
        
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Grabaciones de Audio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.hasAudioCount}</div>
            <p className="text-xs text-muted-foreground">
              {statsData.audioPercentage}% de las respuestas incluyen audio
            </p>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Exportar Datos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleExportExcel} size="sm" className="bg-green-600 hover:bg-green-700">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </Button>
              
              <Button onClick={handleExportCSV} size="sm" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                CSV
              </Button>
              
              {hasAudioRecordings && (
                <Button onClick={handleExportAudio} size="sm" variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700">
                  <Mic className="mr-2 h-4 w-4" />
                  Audio
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="questions">Preguntas y Respuestas</TabsTrigger>
          <TabsTrigger value="detailed">Detallado</TabsTrigger>
          {responses.some(r => r.audioRecording) && (
            <TabsTrigger value="audio">Grabaciones</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {questionsData.map((question) => {
            if (question?.type === 'multiple-choice') {
              return (
                <Card key={question.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{question.text}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className={isMobile ? "h-60" : "h-80"}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={question.data}
                            margin={{ top: 10, right: 30, left: isMobile ? 0 : 20, bottom: isMobile ? 60 : 30 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="name" 
                              angle={isMobile ? -45 : 0} 
                              textAnchor={isMobile ? "end" : "middle"}
                              height={isMobile ? 80 : 60}
                              tick={{ fontSize: isMobile ? 10 : 12 }}
                            />
                            <YAxis />
                            <Tooltip formatter={(value) => [`${value} respuestas`, 'Cantidad']} />
                            <Bar dataKey="value" name="Respuestas" fill="#8884d8">
                              {question.data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`#${Math.floor(Math.random() * 16777215).toString(16)}`} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className={`${isMobile ? "h-60" : "h-80"} ${isMobile ? "mt-6" : ""}`}>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Opción</TableHead>
                              <TableHead>Respuestas</TableHead>
                              <TableHead>Porcentaje</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {question.data.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.value}</TableCell>
                                <TableCell>{item.percentage}%</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            } else if (question?.type === 'free-text') {
              return (
                <Card key={question.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{question.text}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {question.answers.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>#</TableHead>
                              <TableHead>Respuesta</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {question.answers.map((answer, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{idx + 1}</TableCell>
                                <TableCell>{answer}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No hay respuestas para esta pregunta.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            }
            return null;
          })}
        </TabsContent>
        
        {/* New tab for Questions and Answers */}
        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preguntas y Respuestas</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {survey.questions.map((question, questionIndex) => (
                  <AccordionItem key={question.id} value={question.id}>
                    <AccordionTrigger className="text-base font-medium">
                      Pregunta {questionIndex + 1}: {question.text}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="px-4 py-2 space-y-4">
                        {question.type === 'multiple-choice' && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Opciones:</h4>
                            <ul className="list-disc pl-6 mb-4">
                              {question.options.map((option, idx) => (
                                <li key={idx}>{option}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      
                        <h4 className="text-sm font-medium mb-2">Respuestas: ({responses.length})</h4>
                        {responses.length > 0 ? (
                          <div className="border rounded-md overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-1/6">Encuestado</TableHead>
                                  <TableHead className="w-1/6">Fecha</TableHead>
                                  <TableHead>Respuesta</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {responses.map((response, index) => {
                                  const answer = response.answers.find(a => a.questionId === question.id);
                                  const displayValue = 
                                    question.type === 'multiple-choice' 
                                      ? answer?.selectedOption || '-'
                                      : answer?.textAnswer || '-';
                                      
                                  return (
                                    <TableRow key={response.id}>
                                      <TableCell className="font-medium">
                                        Encuestado {index + 1}
                                      </TableCell>
                                      <TableCell>
                                        {new Date(response.completedAt).toLocaleDateString()}
                                      </TableCell>
                                      <TableCell>{displayValue}</TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">
                            No hay respuestas para esta pregunta.
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <CardTitle>Respuestas Detalladas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Encuestado</TableHead>
                      <TableHead>Fecha</TableHead>
                      {survey.questions.map((q) => (
                        <TableHead key={q.id}>{q.text}</TableHead>
                      ))}
                      <TableHead>Audio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((response, index) => (
                      <TableRow key={response.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>Encuestado {index + 1}</TableCell>
                        <TableCell>{new Date(response.completedAt).toLocaleString()}</TableCell>
                        {survey.questions.map((question) => {
                          const answer = response.answers.find(a => a.questionId === question.id);
                          let displayValue = '';
                          
                          if (answer) {
                            if (question.type === 'multiple-choice') {
                              displayValue = answer.selectedOption;
                            } else if (question.type === 'free-text' && answer.textAnswer) {
                              displayValue = answer.textAnswer;
                            }
                          }
                          
                          return (
                            <TableCell key={question.id}>
                              {displayValue || '-'}
                            </TableCell>
                          );
                        })}
                        <TableCell>
                          {response.audioRecording ? (
                            <div className="flex items-center justify-center">
                              <Mic className="h-4 w-4 text-blue-600" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <span className="text-gray-400">-</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {responses.some(r => r.audioRecording) && (
          <TabsContent value="audio">
            <Card>
              <CardHeader>
                <CardTitle>Grabaciones de Audio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {responses.filter(r => r.audioRecording).map((response, index) => (
                    <div key={response.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Encuestado {index + 1}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(response.completedAt).toLocaleString()}
                        </span>
                      </div>
                      <audio 
                        controls 
                        src={response.audioRecording || undefined} 
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
