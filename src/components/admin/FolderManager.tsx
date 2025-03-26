import { useState, useEffect } from 'react';
import { useSurveyStore, SurveyFolder, Survey } from '@/store/surveyStore';
import { useUserStore } from '@/store/userStore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Folder, 
  FolderPlus, 
  MoreHorizontal, 
  Pencil, 
  Trash, 
  Users, 
  Loader2,
  FolderDown,
  ArrowRight,
  FileText,
  ClipboardList
} from 'lucide-react';
import { formatDate } from '@/utils/api';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export function FolderManager() {
  const { 
    folders, 
    surveys,
    createFolder, 
    updateFolder, 
    deleteFolder, 
    assignFolderToSurveyors, 
    getSubfolders, 
    isLoading 
  } = useSurveyStore();
  const { users, fetchUsers } = useUserStore();
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showEditFolderDialog, setShowEditFolderDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<SurveyFolder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [selectedSurveyors, setSelectedSurveyors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'folders' | 'surveys'>('folders');
  
  const surveyors = users.filter(user => user.role === 'surveyor' && user.active);
  
  // Filter folders based on current level
  const currentFolders = folders.filter(folder => folder.parentId === currentParentId);
  
  // Get surveys in current folder
  const currentSurveys = surveys.filter(survey => survey.folderId === currentParentId);
  
  // Get navigation path (breadcrumb)
  const getBreadcrumb = () => {
    const breadcrumb: SurveyFolder[] = [];
    let currentId = currentParentId;
    
    while (currentId) {
      const folder = folders.find(f => f.id === currentId);
      if (folder) {
        breadcrumb.unshift(folder);
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    
    return breadcrumb;
  };
  
  const navigateTo = (folderId: string | null) => {
    setCurrentParentId(folderId);
  };
  
  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      toast.error('El nombre de la carpeta es obligatorio');
      return;
    }
    
    setIsSaving(true);
    
    try {
      await createFolder({
        name: folderName,
        description: folderDescription,
        createdBy: '1', // Current admin user ID
        parentId: parentFolderId
      });
      
      toast.success('Carpeta creada correctamente');
      setShowNewFolderDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Error al crear la carpeta');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleEditFolder = async () => {
    if (!selectedFolder) return;
    if (!folderName.trim()) {
      toast.error('El nombre de la carpeta es obligatorio');
      return;
    }
    
    setIsSaving(true);
    
    try {
      await updateFolder(selectedFolder.id, {
        name: folderName,
        description: folderDescription,
        parentId: parentFolderId
      });
      
      toast.success('Carpeta actualizada correctamente');
      setShowEditFolderDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error updating folder:', error);
      toast.error('Error al actualizar la carpeta');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteFolder = async () => {
    if (!selectedFolder) return;
    
    setIsSaving(true);
    
    try {
      await deleteFolder(selectedFolder.id);
      
      toast.success('Carpeta eliminada correctamente');
      setShowDeleteDialog(false);
      setSelectedFolder(null);
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Error al eliminar la carpeta');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleOpenNewFolderDialog = () => {
    setParentFolderId(currentParentId);
    setShowNewFolderDialog(true);
  };
  
  const handleOpenEditDialog = (folder: SurveyFolder) => {
    setSelectedFolder(folder);
    setFolderName(folder.name);
    setFolderDescription(folder.description);
    setParentFolderId(folder.parentId);
    setShowEditFolderDialog(true);
  };
  
  const handleOpenAssignDialog = (folder: SurveyFolder) => {
    setSelectedFolder(folder);
    setSelectedSurveyors([]);
    setShowAssignDialog(true);
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
    if (!selectedFolder) return;
    
    setIsSaving(true);
    
    try {
      await assignFolderToSurveyors(selectedFolder.id, selectedSurveyors);
      
      toast.success('Encuestadores asignados correctamente');
      setShowAssignDialog(false);
    } catch (error) {
      console.error('Error assigning surveyors to folder:', error);
      toast.error('Error al asignar encuestadores');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleEnterFolder = (folder: SurveyFolder) => {
    navigateTo(folder.id);
  };
  
  const resetForm = () => {
    setFolderName('');
    setFolderDescription('');
    setSelectedFolder(null);
    setParentFolderId(null);
  };
  
  const availableParentFolders = folders.filter(folder => {
    // No permitir circular references
    if (selectedFolder && folder.id === selectedFolder.id) {
      return false;
    }
    
    // No permitir que una carpeta se asigne a un subfolder suyo
    if (selectedFolder) {
      let currentFolder = folder;
      while (currentFolder.parentId) {
        if (currentFolder.parentId === selectedFolder.id) {
          return false;
        }
        const parentFolder = folders.find(f => f.id === currentFolder.parentId);
        if (!parentFolder) break;
        currentFolder = parentFolder;
      }
    }
    
    return true;
  });
  
  const breadcrumb = getBreadcrumb();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col space-y-2">
          <h2 className="text-2xl font-bold">Carpetas de Encuestas</h2>
          
          {/* Breadcrumb navigation */}
          {currentParentId && (
            <div className="flex items-center text-sm">
              <Button 
                variant="link" 
                className="p-0 h-auto text-muted-foreground" 
                onClick={() => navigateTo(null)}
              >
                Raíz
              </Button>
              
              {breadcrumb.map((folder, index) => (
                <div key={folder.id} className="flex items-center">
                  <ArrowRight className="mx-1 h-3 w-3 text-muted-foreground" />
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-muted-foreground"
                    onClick={() => navigateTo(index === breadcrumb.length - 1 ? folder.id : folder.parentId)}
                  >
                    {folder.name}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          {currentParentId && (
            <Button 
              variant="outline" 
              onClick={() => navigateTo(folders.find(f => f.id === currentParentId)?.parentId || null)}
              className="gap-2"
            >
              <FolderDown className="h-4 w-4" />
              Subir
            </Button>
          )}
          
          <Button onClick={handleOpenNewFolderDialog} className="btn-admin">
            <FolderPlus className="mr-2 h-4 w-4" />
            Nueva Carpeta
          </Button>
        </div>
      </div>
      
      {currentParentId && (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'folders' | 'surveys')}>
          <TabsList>
            <TabsTrigger value="folders">Carpetas</TabsTrigger>
            <TabsTrigger value="surveys">Encuestas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="folders">
            {currentFolders.length === 0 ? (
              <Card className="bg-muted/50">
                <CardContent className="flex flex-col items-center justify-center pt-10 pb-10">
                  <Folder className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Esta carpeta está vacía. Crea subcarpetas para organizar tus encuestas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentFolders.map(folder => {
                  const hasSubfolders = folders.some(f => f.parentId === folder.id);
                  
                  return (
                    <Card 
                      key={folder.id} 
                      className="admin-card hover:border-admin/30 transition-all duration-300 hover:shadow-md cursor-pointer"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-2">
                            <Folder className="h-5 w-5 text-admin mt-1" />
                            <div>
                              <CardTitle>{folder.name}</CardTitle>
                              <CardDescription className="mt-1 line-clamp-2">
                                {folder.description}
                              </CardDescription>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditDialog(folder);
                              }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAssignDialog(folder);
                              }}>
                                <Users className="mr-2 h-4 w-4" />
                                Asignar a Encuestadores
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFolder(folder);
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
                        <div className="text-sm">
                          <p className="text-muted-foreground">Fecha de creación</p>
                          <p>{formatDate(folder.createdAt)}</p>
                          
                          {hasSubfolders && (
                            <p className="mt-2 text-xs text-blue-600">
                              Contiene subcarpetas
                            </p>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-4 pb-4 border-t justify-between">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAssignDialog(folder);
                          }}
                          className="gap-1"
                        >
                          <Users className="h-4 w-4" />
                          Asignar
                        </Button>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleEnterFolder(folder)}
                            className="gap-1"
                          >
                            <Folder className="h-4 w-4" />
                            Abrir
                          </Button>
                          
                          <Button 
                            className="btn-admin" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDialog(folder);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="surveys">
            {currentSurveys.length === 0 ? (
              <Card className="bg-muted/50">
                <CardContent className="flex flex-col items-center justify-center pt-10 pb-10">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No hay encuestas asignadas a esta carpeta.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {currentSurveys.map(survey => (
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
                        <FileText className="h-5 w-5 text-admin" />
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
                            {survey.assignedTo.length > 0 ? (
                              survey.assignedTo.map((userId, index) => {
                                const user = users.find(u => u.id === userId);
                                return (
                                  <Badge key={index} variant="secondary" className="mr-1 mt-1">
                                    {user ? user.name : 'Desconocido'}
                                  </Badge>
                                );
                              })
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
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/admin/results/${survey.id}`}>
                            Ver resultados
                          </Link>
                        </Button>
                        <Button asChild className="btn-admin" size="sm">
                          <Link to={`/admin/surveys/edit/${survey.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {!currentParentId && (
        <>
          {currentFolders.length === 0 ? (
            <Card className="bg-muted/50">
              <CardContent className="flex flex-col items-center justify-center pt-10 pb-10">
                <Folder className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No hay carpetas disponibles. Crea una nueva carpeta para organizar tus encuestas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentFolders.map(folder => {
                const hasSubfolders = folders.some(f => f.parentId === folder.id);
                
                return (
                  <Card 
                    key={folder.id} 
                    className="admin-card hover:border-admin/30 transition-all duration-300 hover:shadow-md cursor-pointer"
                    onClick={() => handleEnterFolder(folder)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-2">
                          <Folder className="h-5 w-5 text-admin mt-1" />
                          <div>
                            <CardTitle>{folder.name}</CardTitle>
                            <CardDescription className="mt-1 line-clamp-2">
                              {folder.description}
                            </CardDescription>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDialog(folder);
                            }}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAssignDialog(folder);
                            }}>
                              <Users className="mr-2 h-4 w-4" />
                              Asignar a Encuestadores
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFolder(folder);
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
                      <div className="text-sm">
                        <p className="text-muted-foreground">Fecha de creación</p>
                        <p>{formatDate(folder.createdAt)}</p>
                        
                        {hasSubfolders && (
                          <p className="mt-2 text-xs text-blue-600">
                            Contiene subcarpetas
                          </p>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-4 pb-4 border-t justify-between">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAssignDialog(folder);
                        }}
                        className="gap-1"
                      >
                        <Users className="h-4 w-4" />
                        Asignar
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          className="gap-1"
                        >
                          <Folder className="h-4 w-4" />
                          Abrir
                        </Button>
                        
                        <Button 
                          className="btn-admin" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditDialog(folder);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
      
      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Carpeta</DialogTitle>
            <DialogDescription>
              Crea una nueva carpeta para organizar tus encuestas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="folder-name" className="text-sm font-medium">
                Nombre de la carpeta
              </label>
              <Input
                id="folder-name"
                placeholder="Ej: Encuestas de Satisfacción"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="folder-description" className="text-sm font-medium">
                Descripción
              </label>
              <Textarea
                id="folder-description"
                placeholder="Describe brevemente el propósito de esta carpeta"
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="parent-folder" className="text-sm font-medium">
                Carpeta padre (opcional)
              </label>
              <Select 
                value={parentFolderId || "null"}
                onValueChange={(value) => setParentFolderId(value === "null" ? null : value)}
              >
                <SelectTrigger id="parent-folder">
                  <SelectValue placeholder="Selecciona una carpeta padre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Raíz (sin carpeta padre)</SelectItem>
                  {availableParentFolders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNewFolderDialog(false);
                resetForm();
              }}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateFolder} 
              className="btn-admin" 
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>Crear Carpeta</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Folder Dialog */}
      <Dialog open={showEditFolderDialog} onOpenChange={setShowEditFolderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Carpeta</DialogTitle>
            <DialogDescription>
              Actualiza los detalles de la carpeta
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-folder-name" className="text-sm font-medium">
                Nombre de la carpeta
              </label>
              <Input
                id="edit-folder-name"
                placeholder="Ej: Encuestas de Satisfacción"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="edit-folder-description" className="text-sm font-medium">
                Descripción
              </label>
              <Textarea
                id="edit-folder-description"
                placeholder="Describe brevemente el propósito de esta carpeta"
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="edit-parent-folder" className="text-sm font-medium">
                Carpeta padre (opcional)
              </label>
              <Select 
                value={parentFolderId || "null"}
                onValueChange={(value) => setParentFolderId(value === "null" ? null : value)}
              >
                <SelectTrigger id="edit-parent-folder">
                  <SelectValue placeholder="Selecciona una carpeta padre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Raíz (sin carpeta padre)</SelectItem>
                  {availableParentFolders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditFolderDialog(false);
                resetForm();
              }}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleEditFolder} 
              className="btn-admin" 
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>Guardar Cambios</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Folder Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la carpeta "{selectedFolder?.name}" 
              y todas sus subcarpetas. Las encuestas serán desasignadas de estas carpetas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteFolder();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSaving}
            >
              {isSaving ? (
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
      
      {/* Assign Folder Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Carpeta a Encuestadores</DialogTitle>
            <DialogDescription>
              Selecciona los encuestadores que tendrán acceso a todas las encuestas en esta carpeta
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
            <Button 
              variant="outline" 
              onClick={() => setShowAssignDialog(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveAssignments} 
              className="btn-admin" 
              disabled={isSaving || surveyors.length === 0}
            >
              {isSaving ? (
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
