
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie } from 'recharts';
import { useSurveyStore } from '@/store/surveyStore';
import { Button } from '@/components/ui/button';
import { DownloadIcon, Mic } from 'lucide-react';
import { exportResultsToCSV, exportResultsToExcel, exportAudioRecordings } from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

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
          data: Object.entries(optionCounts).map(([name, value]) => ({ name, value }))
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
      <div className="flex flex-col lg:flex-row justify-between gap-4">
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
      </div>
      
      <div className="flex flex-wrap gap-2 justify-end">
        <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700">
          <DownloadIcon className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
        
        <Button onClick={handleExportCSV} variant="outline">
          <DownloadIcon className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
        
        {hasAudioRecordings && (
          <Button onClick={handleExportAudio} variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700">
            <Mic className="mr-2 h-4 w-4" />
            Exportar Audio
          </Button>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
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
                          <Tooltip />
                          <Bar dataKey="value" name="Respuestas" fill="#8884d8">
                            {question.data.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={`#${Math.floor(Math.random() * 16777215).toString(16)}`} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
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
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {question.answers.length > 0 ? (
                        question.answers.map((answer, idx) => (
                          <div key={idx} className="p-3 bg-muted rounded-md text-sm">{answer}</div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No hay respuestas para esta pregunta.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            }
            return null;
          })}
        </TabsContent>
        
        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <CardTitle>Respuestas Detalladas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted text-left">
                      <th className="p-2 border">ID</th>
                      <th className="p-2 border">Encuestado</th>
                      <th className="p-2 border">Fecha</th>
                      {survey.questions.map((q) => (
                        <th key={q.id} className="p-2 border">{q.text}</th>
                      ))}
                      <th className="p-2 border">Audio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((response) => (
                      <tr key={response.id} className="hover:bg-muted/50">
                        <td className="p-2 border">{response.id.slice(0, 8)}</td>
                        <td className="p-2 border">{response.respondentId}</td>
                        <td className="p-2 border">{new Date(response.completedAt).toLocaleString()}</td>
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
                            <td key={question.id} className="p-2 border">
                              {displayValue || '-'}
                            </td>
                          );
                        })}
                        <td className="p-2 border text-center">
                          {response.audioRecording ? "✓" : "✗"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  {responses.filter(r => r.audioRecording).map((response) => (
                    <div key={response.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">ID: {response.id.slice(0, 8)}</span>
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
