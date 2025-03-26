import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSurveyStore, Survey } from '@/store/surveyStore';
import { FolderManager } from '@/components/admin/FolderManager';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from '@/utils/api';
import { ClipboardList, Edit, FolderOpen, Loader2, MoreHorizontal, Plus, Search, Trash, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

export function SurveyManager() {
  const { 
    surveys, 
    folders, 
    fetchSurveys, 
    deleteSurvey, 
    assignSurvey, 
    assignSurveyToFolder,
    isLoading 
  } = useSurveyStore();
  const { users, fetchUsers } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedSurveyors, setSelectedSurveyors] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [activeTab, setActiveTab] = useState("encuestas");
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isAssigningFolder, setIsAssigningFolder] = useState(false);
  
  useEffect(() => {
    fetchSurveys();
    fetchUsers();
  }, [fetchSurveys, fetchUsers]);
  
  const filteredSurveys = surveys.filter(survey => 
    survey.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    survey.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const surveyors = users.filter(user => user.role === 'surveyor' && user.active);
  
  const getSurveyorNames = (surveyorIds: string[]) => {
    return surveyorIds.map(id => {
      const user = users.find(u => u.id === id);
      return user ? user.name : 'Desconocido';
    });
  };
  
  const getFolderName = (folderId: string | null) => {
    if (!folderId) return 'Sin carpeta';
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : 'Carpeta desconocida';
  };
  
  const confirmDelete = async () => {
    if (!selectedSurvey) return;
    
    setIsDeleting(true);
    
    try {
      await deleteSurvey(selectedSurvey.id);
      toast.success('Encuesta eliminada correctamente');
    } catch (error) {
      console.error('Error deleting survey:', error);
      toast.error('Error al eliminar la encuesta');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setSelectedSurvey(null);
    }
  };
  
  const handleOpenAssignDialog = (survey: Survey) => {
    setSelectedSurvey(survey);
    setSelectedSurveyors(survey.assignedTo);
    setShowAssignDialog(true);
  };
  
  const handleOpenFolderDialog = (survey: Survey) => {
    setSelectedSurvey(survey);
    setSelectedFolderId(survey.folderId);
    setShowFolderDialog(true);
  };
  
  const handleSurveyorSelection = (surveyorId: string) => {
    setSelectedSurveyors(prev => {
      if (prev.includes(surveyorId)) {
        return prev.filter(id => id !== surveyorId);
      } else {
        return [...prev, surveyorId];
      }
    });
  };
  
  const handleSaveAssignments = async () => {
    if (!selectedSurvey) return;
    
    setIsAssigning(true);
    
    try {
      await assignSurvey(selectedSurvey.id, selectedSurveyors);
      toast.success('Encuestadores asignados correctamente');
      setShowAssignDialog(false);
    } catch (error) {
      console.error('Error assigning surveyors:', error);
      toast.error('Error al asignar encuestadores');
    } finally {
      setIsAssigning(false);
    }
  };
  
  const handleSaveFolderAssignment = async () => {
    if (!selectedSurvey) return;
    
    setIsAssigningFolder(true);
    
    try {
      await assignSurveyToFolder(selectedSurvey.id, selectedFolderId);
      toast.success('Encuesta asignada a carpeta correctamente');
      setShowFolderDialog(false);
    } catch (error) {
      console.error('Error assigning survey to folder:', error);
      toast.error('Error al asignar encuesta a carpeta');
    } finally {
      setIsAssigningFolder(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="encuestas">Encuestas</TabsTrigger>
          <TabsTrigger value="carpetas">Carpetas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="encuestas" className="space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar encuestas..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button asChild className="btn-admin shrink-0 w-full sm:w-auto">
              <Link to="/admin/surveys/new">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Encuesta
              </Link>
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-admin" />
            </div>
          ) : filteredSurveys.length === 0 ? (
            <Card className="bg-muted/50">
              <CardContent className="flex flex-col items-center justify-center pt-10 pb-10">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                {searchQuery ? (
                  <p className="text-muted-foreground text-center">
                    No se encontraron encuestas que coincidan con "{searchQuery}"
                  </p>
                ) : (
                  <p className="text-muted-foreground text-center">
                    No hay encuestas disponibles. Crea una nueva encuesta para comenzar.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredSurveys.map(survey => {
                const surveyorNames = getSurveyorNames(survey.assignedTo);
                const folderName = getFolderName(survey.folderId);
                
                return (
                  <Card key={survey.id} className="admin-card hover:border-admin/30 transition-all duration-300 hover:shadow-md">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <CardTitle>{survey.title}</CardTitle>
                            <Badge 
                              variant={survey.isActive ? "outline" : "secondary"}
                              className={`ml-2 ${survey.isActive ? 'text-green-600 border-green-200' : ''}`}
                            >
                              {survey.isActive ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </div>
                          <CardDescription className="mt-1">
                            {survey.description}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/surveys/edit/${survey.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/results/${survey.id}`}>
                                <ClipboardList className="mr-2 h-4 w-4" />
                                Ver Resultados
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenAssignDialog(survey)}
                            >
                              <Users className="mr-2 h-4 w-4" />
                              Asignar Encuestadores
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenFolderDialog(survey)}
                            >
                              <FolderOpen className="mr-2 h-4 w-4" />
                              Asignar a Carpeta
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setSelectedSurvey(survey);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Preguntas</p>
                          <p>{survey.questions.length} {survey.questions.length === 1 ? 'pregunta' : 'preguntas'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Fecha de creación</p>
                          <p>{formatDate(survey.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Carpeta</p>
                          <div className="flex items-center gap-1">
                            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                            <p>{folderName}</p>
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-muted-foreground">Asignada a</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {surveyorNames.length > 0 ? (
                              surveyorNames.map((name, index) => (
                                <Badge key={index} variant="secondary" className="mr-1 mt-1">
                                  {name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground italic">
                                No asignada
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-4 pb-4 border-t justify-between">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenAssignDialog(survey)}
                          className="gap-1"
                        >
                          <Users className="h-4 w-4" />
                          Asignar
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenFolderDialog(survey)}
                          className="gap-1"
                        >
                          <FolderOpen className="h-4 w-4" />
                          Carpeta
                        </Button>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/admin/results/${survey.id}`}>
                            Ver resultados
                          </Link>
                        </Button>
                        <Button asChild className="btn-admin" size="sm">
                          <Link to={`/admin/surveys/edit/${survey.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="carpetas" className="space-y-6 mt-6">
          <FolderManager />
        </TabsContent>
      </Tabs>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la encuesta "{selectedSurvey?.title}" 
              y no se podrá recuperar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>Eliminar</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Encuestadores</DialogTitle>
            <DialogDescription>
              Selecciona los encuestadores que realizarán esta encuesta
            </DialogDescription>
          </DialogHeader>
          
          {surveyors.length === 0 ? (
            <div className="py-6 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No hay encuestadores disponibles. Crea nuevos usuarios con rol de encuestador.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-4">
                {surveyors.map(surveyor => (
                  <div key={surveyor.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`surveyor-${surveyor.id}`}
                      checked={selectedSurveyors.includes(surveyor.id)}
                      onCheckedChange={() => handleSurveyorSelection(surveyor.id)}
                    />
                    <label
                      htmlFor={`surveyor-${surveyor.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {surveyor.name}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveAssignments} 
              className="btn-admin" 
              disabled={isAssigning || surveyors.length === 0}
            >
              {isAssigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>Guardar</>
              )}
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
            <Select 
              value={selectedFolderId || "null"}
              onValueChange={(value) => setSelectedFolderId(value === "null" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una carpeta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Sin carpeta</SelectItem>
                {folders.map(folder => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveFolderAssignment} 
              className="btn-admin" 
              disabled={isAssigningFolder}
            >
              {isAssigningFolder ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>Guardar</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
