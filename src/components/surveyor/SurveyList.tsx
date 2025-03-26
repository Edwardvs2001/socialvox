
import { useEffect, useState } from 'react';
import { useSurveyStore, SurveyFolder } from '@/store/surveyStore';
import { useAuthStore } from '@/store/authStore';
import { ClipboardList, FolderOpen, Loader2, ArrowRight, ArrowUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SurveyItem } from './SurveyItem';
import { Button } from '@/components/ui/button';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';

export function SurveyList() {
  const { user } = useAuthStore();
  const { surveys, folders, fetchSurveys, isLoading } = useSurveyStore();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // Filter surveys assigned to the current surveyor
  const assignedSurveys = surveys.filter(
    survey => survey.assignedTo.includes(user?.id || '') && survey.isActive
  );
  
  // Get surveys in current folder or root
  const currentSurveys = assignedSurveys.filter(
    survey => survey.folderId === currentFolderId
  );
  
  // Get folders at current level
  const currentFolders = folders.filter(folder => 
    folder.parentId === currentFolderId && 
    // Only show folders that have assigned surveys or contain subfolders with assigned surveys
    (hasSurveysInFolder(folder.id) || hasSubfoldersWithSurveys(folder.id))
  );
  
  // Get all folders with assigned surveys
  const assignedFolders = folders.filter(
    folder => folder.parentId === null && (hasSurveysInFolder(folder.id) || hasSubfoldersWithSurveys(folder.id))
  );
  
  // Pagination calculations
  const totalItems = activeTab === "all" ? assignedSurveys.length : 
                    activeTab === "folder" ? currentSurveys.length : 
                    assignedSurveys.filter(survey => survey.folderId === null).length;
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const paginatedSurveys = (surveys: typeof assignedSurveys) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return surveys.slice(startIndex, endIndex);
  };
  
  // Check if a folder or its subfolders contain assigned surveys
  function hasSurveysInFolder(folderId: string): boolean {
    return assignedSurveys.some(survey => survey.folderId === folderId);
  }
  
  function hasSubfoldersWithSurveys(folderId: string): boolean {
    const subfolders = folders.filter(folder => folder.parentId === folderId);
    
    if (subfolders.length === 0) {
      return false;
    }
    
    return subfolders.some(subfolder => 
      hasSurveysInFolder(subfolder.id) || hasSubfoldersWithSurveys(subfolder.id)
    );
  }
  
  // Get breadcrumb path
  const getBreadcrumb = () => {
    const breadcrumb: SurveyFolder[] = [];
    let currentId = currentFolderId;
    
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
    setCurrentFolderId(folderId);
    setActiveTab('folder');
    setCurrentPage(1); // Reset to first page when navigating
  };
  
  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);
  
  useEffect(() => {
    // Reset current folder when switching to "all" tab
    if (activeTab === "all") {
      setCurrentFolderId(null);
    }
    setCurrentPage(1); // Reset to first page when changing tabs
  }, [activeTab]);
  
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
  
  const breadcrumb = getBreadcrumb();
  const unassignedSurveys = assignedSurveys.filter(survey => survey.folderId === null);
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="folder">Por Carpetas</TabsTrigger>
          {unassignedSurveys.length > 0 && (
            <TabsTrigger value="unassigned">Sin carpeta</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="all">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedSurveys(assignedSurveys).map(survey => (
              <SurveyItem key={survey.id} survey={survey} />
            ))}
          </div>
          
          {totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                      className="cursor-pointer"
                    />
                  </PaginationItem>
                )}
                
                {Array.from({ length: totalPages }).map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      isActive={currentPage === index + 1}
                      onClick={() => setCurrentPage(index + 1)}
                      className="cursor-pointer"
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                {currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                      className="cursor-pointer"
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </TabsContent>
        
        <TabsContent value="folder">
          <div className="mb-4">
            {currentFolderId ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center text-sm mb-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="p-1 h-8" 
                    onClick={() => navigateTo(null)}
                  >
                    <FolderOpen className="mr-1 h-4 w-4 text-surveyor" />
                    Raíz
                  </Button>
                  
                  {breadcrumb.map((folder, index) => (
                    <div key={folder.id} className="flex items-center">
                      <ArrowRight className="mx-1 h-3 w-3 text-muted-foreground" />
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="p-1 h-8"
                        onClick={() => navigateTo(index === breadcrumb.length - 1 ? folder.id : folder.parentId)}
                      >
                        {folder.name}
                      </Button>
                    </div>
                  ))}
                </div>
                
                {currentFolderId && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const parentFolder = folders.find(f => f.id === currentFolderId);
                      navigateTo(parentFolder?.parentId || null);
                    }}
                    className="mb-4"
                  >
                    <ArrowUp className="mr-2 h-4 w-4" />
                    Subir al nivel superior
                  </Button>
                )}
              </div>
            ) : (
              <h3 className="text-lg font-medium mb-4">Carpetas</h3>
            )}
            
            {/* Folders grid */}
            {currentFolders.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                {currentFolders.map(folder => (
                  <Card 
                    key={folder.id} 
                    className="hover:bg-muted/30 transition-colors cursor-pointer border border-muted"
                    onClick={() => navigateTo(folder.id)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-center">
                        <FolderOpen className="h-5 w-5 text-surveyor mr-2" />
                        <div>
                          <CardTitle className="text-base">{folder.name}</CardTitle>
                          {folder.description && (
                            <CardDescription className="text-xs mt-1">
                              {folder.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Current folder surveys */}
            {currentSurveys.length > 0 ? (
              <>
                <h3 className="text-base font-medium mt-6 mb-3">
                  Encuestas {currentFolderId ? `en esta carpeta` : 'sin carpeta'}
                </h3>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedSurveys(currentSurveys).map(survey => (
                    <SurveyItem key={survey.id} survey={survey} />
                  ))}
                </div>
                
                {totalPages > 1 && (
                  <Pagination className="mt-8">
                    <PaginationContent>
                      {currentPage > 1 && (
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                            className="cursor-pointer"
                          />
                        </PaginationItem>
                      )}
                      
                      {Array.from({ length: totalPages }).map((_, index) => (
                        <PaginationItem key={index}>
                          <PaginationLink
                            isActive={currentPage === index + 1}
                            onClick={() => setCurrentPage(index + 1)}
                            className="cursor-pointer"
                          >
                            {index + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      {currentPage < totalPages && (
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                            className="cursor-pointer"
                          />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            ) : currentFolderId && currentFolders.length === 0 ? (
              <Card className="bg-muted/50 mt-4">
                <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
                  <ClipboardList className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-center text-sm">
                    Esta carpeta no contiene encuestas asignadas a ti.
                  </p>
                </CardContent>
              </Card>
            ) : !currentFolderId && assignedFolders.length === 0 && unassignedSurveys.length === 0 ? (
              <Card className="bg-muted/50 mt-4">
                <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
                  <ClipboardList className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-center text-sm">
                    No tienes encuestas asignadas organizadas en carpetas.
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>
        
        {unassignedSurveys.length > 0 && (
          <TabsContent value="unassigned">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Encuestas sin carpeta</h3>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedSurveys(unassignedSurveys).map(survey => (
                <SurveyItem key={survey.id} survey={survey} />
              ))}
            </div>
            
            {unassignedSurveys.length > itemsPerPage && (
              <Pagination className="mt-8">
                <PaginationContent>
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                  )}
                  
                  {Array.from({ length: Math.ceil(unassignedSurveys.length / itemsPerPage) }).map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        isActive={currentPage === index + 1}
                        onClick={() => setCurrentPage(index + 1)}
                        className="cursor-pointer"
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  {currentPage < Math.ceil(unassignedSurveys.length / itemsPerPage) && (
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(unassignedSurveys.length / itemsPerPage)))} 
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
