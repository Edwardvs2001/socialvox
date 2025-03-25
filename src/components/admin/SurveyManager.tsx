
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSurveyStore, Survey } from '@/store/surveyStore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { formatDate } from '@/utils/api';
import { ClipboardList, Edit, Loader2, MoreHorizontal, Plus, Search, Trash, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';

export function SurveyManager() {
  const { surveys, fetchSurveys, deleteSurvey, isLoading } = useSurveyStore();
  const { users } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch surveys
  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);
  
  // Filter surveys based on search query
  const filteredSurveys = surveys.filter(survey => 
    survey.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    survey.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get user names for assigned surveyors
  const getSurveyorNames = (surveyorIds: string[]) => {
    return surveyorIds.map(id => {
      const user = users.find(u => u.id === id);
      return user ? user.name : 'Desconocido';
    });
  };
  
  // Handle survey deletion
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
  
  return (
    <div className="space-y-6">
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
                          <Link to={`/admin/surveys/assign/${survey.id}`}>
                            <Users className="mr-2 h-4 w-4" />
                            Asignar
                          </Link>
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
                <CardFooter className="pt-4 pb-4 border-t justify-end">
                  <Button asChild variant="outline" size="sm" className="mr-2">
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
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Delete confirmation dialog */}
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
    </div>
  );
}
