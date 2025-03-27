import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { useSurveyStore, Survey, SurveyQuestion } from '@/store/surveyStore';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Save, Trash, AlertTriangle, Users, ListChecks, MessageSquare, FolderOpen, Link } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  title: z.string().min(3, {
    message: "El título debe tener al menos 3 caracteres"
  }),
  description: z.string().min(5, {
    message: "La descripción debe tener al menos 5 caracteres"
  }),
  isActive: z.boolean().default(true),
  collectDemographics: z.boolean().default(true)
});

interface SurveyEditorProps {
  surveyId: string | null;
}

export function SurveyEditor({
  surveyId
}: SurveyEditorProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    getSurveyById,
    createSurvey,
    updateSurvey,
    assignSurvey,
    assignSurveyToFolder,
    folders,
    isLoading
  } = useSurveyStore();
  const { users } = useUserStore();
  
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [showDeleteQuestionDialog, setShowDeleteQuestionDialog] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedSurveyors, setSelectedSurveyors] = useState<string[]>([]);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
  const isMobile = useIsMobile();
  
  const existingSurvey = surveyId ? getSurveyById(surveyId) : null;
  const surveyors = users.filter(user => user.role === 'surveyor' && user.active);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: existingSurvey?.title || "",
      description: existingSurvey?.description || "",
      isActive: existingSurvey?.isActive ?? true,
      collectDemographics: existingSurvey?.collectDemographics ?? true
    }
  });
  
  useEffect(() => {
    if (existingSurvey) {
      const updatedQuestions = existingSurvey.questions.map(q => ({
        ...q,
        type: q.type || 'multiple-choice'
      }));
      setQuestions(updatedQuestions);
      setSelectedSurveyors(existingSurvey.assignedTo || []);
      setSelectedFolderId(existingSurvey.folderId);
      
      // Update form values for demographics
      form.setValue("collectDemographics", existingSurvey.collectDemographics ?? true);
    } else {
      // Reset to default state for new survey
      setQuestions([]);
      setSelectedSurveyors([]);
      setSelectedFolderId(null);
    }
  }, [existingSurvey, form]);
  
  const addQuestion = (type: 'multiple-choice' | 'free-text') => {
    try {
      const newQuestion: SurveyQuestion = {
        id: uuidv4(),
        text: "",
        type,
        options: type === 'multiple-choice' ? ["Option 1", "Option 2"] : []
      };
      setQuestions(prevQuestions => [...prevQuestions, newQuestion]);
    } catch (error) {
      console.error("Error adding question:", error);
      toast.error("Error al agregar pregunta");
    }
  };
  
  const updateQuestionText = (id: string, text: string) => {
    setQuestions(questions.map(q => q.id === id ? {
      ...q,
      text
    } : q));
  };
  
  const updateOptionText = (questionId: string, optionIndex: number, text: string) => {
    setQuestions(questions.map(q => q.id === questionId ? {
      ...q,
      options: q.options.map((opt, idx) => idx === optionIndex ? text : opt)
    } : q));
  };
  
  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => q.id === questionId ? {
      ...q,
      options: [...q.options, `Option ${q.options.length + 1}`]
    } : q));
  };
  
  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => q.id === questionId ? {
      ...q,
      options: q.options.filter((_, idx) => idx !== optionIndex)
    } : q));
  };
  
  const updateQuestionCondition = (id: string, dependsOn: string | undefined, showWhen: string[]) => {
    setQuestions(questions.map(q => q.id === id ? {
      ...q,
      dependsOn,
      showWhen: dependsOn ? showWhen : undefined
    } : q));
  };
  
  const confirmDeleteQuestion = (id: string) => {
    setQuestionToDelete(id);
    setShowDeleteQuestionDialog(true);
  };
  
  const deleteQuestion = () => {
    if (questionToDelete) {
      // Before deleting, update any question that depends on this one
      const updatedQuestions = questions.map(q => {
        if (q.dependsOn === questionToDelete) {
          return {
            ...q,
            dependsOn: undefined,
            showWhen: undefined
          };
        }
        return q;
      });
      
      // Now remove the question
      setQuestions(updatedQuestions.filter(q => q.id !== questionToDelete));
      setShowDeleteQuestionDialog(false);
      setQuestionToDelete(null);
    }
  };
  
  const openAssignDialog = () => {
    setShowAssignDialog(true);
  };
  
  const openFolderDialog = () => {
    setShowFolderDialog(true);
  };
  
  const handleAssignSurvey = async (createdSurveyId?: string) => {
    const surveyIdToUse = createdSurveyId || (existingSurvey ? existingSurvey.id : null);
    if (!surveyIdToUse) return;
    
    try {
      await assignSurvey(surveyIdToUse, selectedSurveyors);
      if (!createdSurveyId) {
        // Only show toast if not part of creation
        toast.success("Encuesta asignada correctamente a los encuestadores seleccionados");
      }
      setShowAssignDialog(false);
    } catch (error) {
      console.error("Error assigning survey:", error);
      toast.error("Error al asignar la encuesta");
    }
  };
  
  const handleSaveFolderAssignment = async (createdSurveyId?: string) => {
    const surveyIdToUse = createdSurveyId || (existingSurvey ? existingSurvey.id : null);
    if (!surveyIdToUse) return;
    
    try {
      await assignSurveyToFolder(surveyIdToUse, selectedFolderId);
      if (!createdSurveyId) {
        // Only show toast if not part of creation
        toast.success("Encuesta asignada a carpeta correctamente");
      }
      setShowFolderDialog(false);
    } catch (error) {
      console.error("Error assigning survey to folder:", error);
      toast.error("Error al asignar encuesta a carpeta");
    }
  };
  
  const toggleSurveyor = (surveyorId: string) => {
    setSelectedSurveyors(prevSelected => {
      if (prevSelected.includes(surveyorId)) {
        return prevSelected.filter(id => id !== surveyorId);
      } else {
        return [...prevSelected, surveyorId];
      }
    });
  };
  
  const getAvailableParentQuestions = (currentQuestionId: string) => {
    return questions.filter(q => 
      q.id !== currentQuestionId && 
      q.type === 'multiple-choice' &&
      !hasCircularDependency(currentQuestionId, q.id)
    );
  };
  
  const hasCircularDependency = (childId: string, potentialParentId: string): boolean => {
    const parent = questions.find(q => q.id === potentialParentId);
    
    if (!parent) return false;
    if (!parent.dependsOn) return false;
    if (parent.dependsOn === childId) return true;
    
    return hasCircularDependency(childId, parent.dependsOn);
  };
  
  const validateQuestions = (): boolean => {
    if (questions.length === 0) {
      toast.error("Debe agregar al menos una pregunta a la encuesta");
      return false;
    }
    
    for (const question of questions) {
      if (!question.text.trim()) {
        toast.error("Todas las preguntas deben tener un texto");
        return false;
      }
      
      if (question.type === 'multiple-choice') {
        if (question.options.length < 2) {
          toast.error(`La pregunta "${question.text}" debe tener al menos 2 opciones`);
          return false;
        }
        
        for (const option of question.options) {
          if (!option.trim()) {
            toast.error(`Todas las opciones de la pregunta "${question.text}" deben tener texto`);
            return false;
          }
        }
      }
      
      if (question.dependsOn) {
        const parentQuestion = questions.find(q => q.id === question.dependsOn);
        if (!parentQuestion) {
          toast.error(`La pregunta "${question.text}" depende de una pregunta que ya no existe`);
          return false;
        }
        
        if (parentQuestion.type !== 'multiple-choice') {
          toast.error(`La pregunta "${question.text}" solo puede depender de preguntas de opción múltiple`);
          return false;
        }
        
        if (!question.showWhen || question.showWhen.length === 0) {
          toast.error(`La pregunta "${question.text}" debe especificar al menos una opción que la active`);
          return false;
        }
        
        for (const option of question.showWhen) {
          if (!parentQuestion.options.includes(option)) {
            toast.error(`La opción condicional "${option}" ya no existe en la pregunta padre`);
            return false;
          }
        }
      }
    }
    
    return true;
  };
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!validateQuestions()) return;
    
    setIsSubmitting(true);
    
    try {
      if (existingSurvey) {
        await updateSurvey(existingSurvey.id, {
          ...values,
          questions
        });
        
        // Handle assignments if modified
        if (selectedFolderId !== existingSurvey.folderId) {
          await handleSaveFolderAssignment();
        }
        
        if (JSON.stringify(selectedSurveyors) !== JSON.stringify(existingSurvey.assignedTo)) {
          await handleAssignSurvey();
        }
        
        toast.success("Encuesta actualizada correctamente");
      } else {
        if (!user) {
          toast.error("Necesita iniciar sesión para crear una encuesta");
          return;
        }
        
        const newSurvey = await createSurvey({
          title: values.title,
          description: values.description,
          isActive: values.isActive,
          questions,
          createdBy: user.id,
          assignedTo: selectedSurveyors,
          folderId: selectedFolderId,
          collectDemographics: values.collectDemographics
        });
        
        toast.success("Encuesta creada correctamente");
        navigate("/admin/surveys");
      }
    } catch (error) {
      console.error("Error saving survey:", error);
      toast.error("Error al guardar la encuesta: " + (error instanceof Error ? error.message : "Error desconocido"));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getFolderPath = (folderId: string | null): string => {
    if (!folderId) return 'Sin carpeta';
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
  
  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Información General</CardTitle>
                <CardDescription>Detalles básicos de la encuesta</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={openFolderDialog} 
                  size={isMobile ? "sm" : "default"} 
                  className="btn-admin text-neutral-950"
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  {selectedFolderId ? "Cambiar Carpeta" : "Asignar Carpeta"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={openAssignDialog} 
                  size={isMobile ? "sm" : "default"} 
                  className="btn-admin text-zinc-950"
                >
                  <Users className="mr-2 h-4 w-4" />
                  {selectedSurveyors.length > 0 ? "Cambiar Encuestadores" : "Asignar Encuestadores"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Título de la encuesta" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nombre descriptivo para identificar la encuesta
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descripción de la encuesta" className="resize-none" {...field} />
                    </FormControl>
                    <FormDescription>
                      Explica brevemente el propósito de esta encuesta
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Encuesta Activa</FormLabel>
                      <FormDescription>
                        Las encuestas activas son visibles para los encuestadores
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="collectDemographics"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Recopilar datos demográficos</FormLabel>
                      <FormDescription>
                        Solicitar edad, género y lugar de la encuesta
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {selectedFolderId && (
                <div className="p-4 rounded-lg border">
                  <FormLabel className="text-base pb-2 block">Carpeta Asignada</FormLabel>
                  <div className="flex items-center gap-1 text-admin">
                    <FolderOpen className="h-3.5 w-3.5" />
                    <span className="font-medium">{getFolderPath(selectedFolderId)}</span>
                  </div>
                </div>
              )}
              
              {selectedSurveyors.length > 0 && (
                <div className="p-4 rounded-lg border">
                  <FormLabel className="text-base pb-2 block">Encuestadores Asignados</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {selectedSurveyors.map(surveyorId => {
                      const surveyor = users.find(u => u.id === surveyorId);
                      return (
                        <div key={surveyorId} className="bg-muted text-xs px-2 py-1 rounded-full">
                          {surveyor?.name || "Desconocido"}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Preguntas</CardTitle>
                <CardDescription>Preguntas y opciones de respuesta</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  type="button" 
                  onClick={() => addQuestion('multiple-choice')} 
                  variant="outline" 
                  size={isMobile ? "sm" : "default"} 
                  className="btn-admin text-zinc-950"
                >
                  <ListChecks className="mr-2 h-4 w-4" />
                  <span className={isMobile ? "text-mobile-xs" : ""}>Opción Múltiple</span>
                </Button>
                <Button 
                  type="button" 
                  onClick={() => addQuestion('free-text')} 
                  variant="outline" 
                  size={isMobile ? "sm" : "default"} 
                  className="btn-admin text-zinc-950"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span className={isMobile ? "text-mobile-xs" : ""}>Respuesta Libre</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-2" />
                  <p>No has agregado preguntas a esta encuesta.</p>
                  <p>Haz clic en los botones de arriba para agregar una pregunta.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((question, qIndex) => (
                    <Card key={question.id} className="border-admin/20">
                      <CardHeader className="pb-2 flex flex-row items-start justify-between">
                        <div className="space-y-1 w-full">
                          <div className="flex items-center">
                            <FormLabel htmlFor={`question-${question.id}`} className="mr-2">
                              Pregunta {qIndex + 1}
                            </FormLabel>
                            <span className="text-xs bg-muted px-2 py-1 rounded-full">
                              {question.type === 'multiple-choice' ? 'Opción Múltiple' : 'Respuesta Libre'}
                            </span>
                            {question.dependsOn && (
                              <span className="text-xs bg-blue-100 text-blue-800 ml-2 px-2 py-1 rounded-full flex items-center">
                                <Link className="h-3 w-3 mr-1" />
                                Condicional
                              </span>
                            )}
                          </div>
                          <Input 
                            id={`question-${question.id}`} 
                            value={question.text} 
                            placeholder="Texto de la pregunta" 
                            onChange={e => updateQuestionText(question.id, e.target.value)} 
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive" 
                          onClick={() => confirmDeleteQuestion(question.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      
                      <CardContent className="border-t border-b py-3 border-muted">
                        <div className="space-y-3">
                          <FormLabel>Lógica condicional</FormLabel>
                          <Select
                            value={question.dependsOn || ""}
                            onValueChange={(value) => {
                              if (value === "") {
                                updateQuestionCondition(question.id, undefined, []);
                              } else {
                                updateQuestionCondition(question.id, value, question.showWhen || []);
                              }
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Esta pregunta no depende de ninguna otra" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No depende de ninguna pregunta</SelectItem>
                              {getAvailableParentQuestions(question.id).map(q => (
                                <SelectItem key={q.id} value={q.id}>
                                  Pregunta {questions.findIndex(item => item.id === q.id) + 1}: {q.text.substring(0, 50)}
                                  {q.text.length > 50 ? "..." : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {question.dependsOn && (
                            <div className="mt-2 space-y-3">
                              <FormLabel>Mostrar cuando se seleccione:</FormLabel>
                              <div className="flex flex-col gap-3">
                                {questions.find(q => q.id === question.dependsOn)?.options.map((option, idx) => (
                                  <div key={idx} className="flex items-center space-x-2">
                                    <Checkbox 
                                      id={`condition-${question.id}-${idx}`}
                                      checked={question.showWhen?.includes(option)}
                                      onCheckedChange={(checked) => {
                                        const currentShowWhen = question.showWhen || [];
                                        if (checked) {
                                          updateQuestionCondition(
                                            question.id, 
                                            question.dependsOn, 
                                            [...currentShowWhen, option]
                                          );
                                        } else {
                                          updateQuestionCondition(
                                            question.id,
                                            question.dependsOn,
                                            currentShowWhen.filter(opt => opt !== option)
                                          );
                                        }
                                      }}
                                    />
                                    <label 
                                      htmlFor={`condition-${question.id}-${idx}`}
                                      className="text-sm"
                                    >
                                      {option || `[Opción ${idx + 1} sin texto]`}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              {(!question.showWhen || question.showWhen.length === 0) && (
                                <div className="text-yellow-600 bg-yellow-50 p-2 rounded text-xs flex items-center">
                                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                                  Selecciona al menos una opción o esta pregunta no se mostrará
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                      
                      {question.type === 'multiple-choice' ? (
                        <CardContent className="pb-2">
                          <div className="space-y-2">
                            <FormLabel>Opciones de respuesta</FormLabel>
                            {question.options.map((option, oIndex) => (
                              <div key={oIndex} className="flex items-center gap-2">
                                <Input 
                                  value={option} 
                                  placeholder={`Opción ${oIndex + 1}`} 
                                  onChange={e => updateOptionText(question.id, oIndex, e.target.value)} 
                                  className="flex-1" 
                                />
                                {question.options.length > 2 && (
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-destructive shrink-0" 
                                    onClick={() => removeOption(question.id, oIndex)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                          <CardFooter className="px-0 pt-4 pb-0">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={() => addOption(question.id)}
                            >
                              <Plus className="mr-2 h-3 w-3" />
                              Agregar Opción
                            </Button>
                          </CardFooter>
                        </CardContent>
                      ) : (
                        <CardContent className="pb-2">
                          <div className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded-md">
                            <MessageSquare className="inline-block mr-2 h-4 w-4" />
                            Los encuestados podrán escribir una respuesta libre a esta pregunta.
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/admin/surveys")}>
              Cancelar
            </Button>
            <Button type="submit" className="btn-admin" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {existingSurvey ? "Actualizando..." : "Creando..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {existingSurvey ? "Actualizar Encuesta" : "Crear Encuesta"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
      
      <AlertDialog open={showDeleteQuestionDialog} onOpenChange={setShowDeleteQuestionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta pregunta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La pregunta será eliminada permanentemente
              de la encuesta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={e => {
                e.preventDefault();
                deleteQuestion();
              }} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Encuestadores</DialogTitle>
            <DialogDescription>
              Selecciona los encuestadores que pueden realizar esta encuesta
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {surveyors.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto pr-2">
                {surveyors.map(surveyor => (
                  <div key={surveyor.id} className="flex items-center space-x-2 py-2 border-b">
                    <Checkbox 
                      id={`surveyor-${surveyor.id}`} 
                      checked={selectedSurveyors.includes(surveyor.id)} 
                      onCheckedChange={() => toggleSurveyor(surveyor.id)} 
                    />
                    <label 
                      htmlFor={`surveyor-${surveyor.id}`} 
                      className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      <div>{surveyor.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{surveyor.email}</div>
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>No hay encuestadores disponibles.</p>
                <p className="text-sm mt-1">Crea usuarios con rol de encuestador primero.</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowAssignDialog(false)}>
              Cancelar
            </Button>
            <Button className="btn-admin" onClick={() => handleAssignSurvey()} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Asignando...
                </>
              ) : "Guardar Asignaciones"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar a Carpeta</DialogTitle>
            <DialogDescription>
              Selecciona la carpeta donde deseas guardar esta encuesta
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select value={selectedFolderId || "null"} onValueChange={value => setSelectedFolderId(value === "null" ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una carpeta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Sin carpeta</SelectItem>
                {folders.map(folder => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {getFolderPath(folder.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleSaveFolderAssignment()} className="btn-admin" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : <>Guardar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
