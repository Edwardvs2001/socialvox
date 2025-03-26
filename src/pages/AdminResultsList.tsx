
import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useSurveyStore } from '@/store/surveyStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Search, BarChart3, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/api';

export default function AdminResultsList() {
  const { surveys, getSurveyResponses } = useSurveyStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter surveys based on search query
  const filteredSurveys = surveys.filter(survey => 
    survey.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    survey.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <AuthLayout requiresAuth={true} allowedRoles={['admin', 'admin-manager']}>
      <AdminLayout
        title="Resultados de Encuestas"
        description="Visualiza y analiza los datos recopilados"
      >
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
          </div>
          
          <div className="grid gap-4">
            {filteredSurveys.map(survey => {
              const responseCount = getSurveyResponses(survey.id).length;
              
              return (
                <Card key={survey.id} className="hover:shadow-md transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex justify-between items-center">
                      <span>{survey.title}</span>
                      <Badge variant="outline" className="ml-2">
                        {responseCount} {responseCount === 1 ? 'respuesta' : 'respuestas'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{survey.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Creada: {formatDate(survey.createdAt)}
                      </span>
                      <Button asChild className="bg-admin hover:bg-admin/90">
                        <Link to={`/admin/results/${survey.id}`}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Ver Resultados
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {filteredSurveys.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    {searchQuery ? 
                      `No se encontraron encuestas que coincidan con "${searchQuery}"` : 
                      'No hay encuestas disponibles para mostrar resultados.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </AdminLayout>
    </AuthLayout>
  );
}
