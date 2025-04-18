
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface SurveyFolder {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  createdBy: string;
  parentId: string | null;
}

export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'multiple-choice' | 'free-text';
  options: string[];
  dependsOn?: string;
  showWhen?: string[];
}

export interface RespondentInfo {
  age?: number;
  gender?: string;
  location?: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  assignedTo: string[];
  folderId: string | null;
  collectDemographics: boolean;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  respondentId: string;
  answers: { questionId: string; selectedOption: string; textAnswer?: string }[];
  audioRecording: string | null;
  completedAt: string;
  syncedToServer: boolean;
  respondentInfo?: RespondentInfo;
}

interface SurveyState {
  surveys: Survey[];
  folders: SurveyFolder[];
  responses: SurveyResponse[];
  isLoading: boolean;
  error: string | null;
  
  fetchSurveys: () => Promise<void>;
  getSurveyById: (id: string) => Survey | undefined;
  createSurvey: (survey: Omit<Survey, 'id' | 'createdAt'>) => Promise<Survey>;
  updateSurvey: (id: string, updates: Partial<Survey>) => Promise<void>;
  deleteSurvey: (id: string) => Promise<void>;
  
  submitResponse: (response: Omit<SurveyResponse, 'id' | 'completedAt' | 'syncedToServer'>) => Promise<void>;
  getSurveyResponses: (surveyId: string) => SurveyResponse[];
  getSurveyorResponses: (surveyorId: string) => SurveyResponse[];
  syncResponses: () => Promise<void>;
  
  assignSurvey: (surveyId: string, surveyorIds: string[]) => Promise<void>;
  
  createFolder: (folder: Omit<SurveyFolder, 'id' | 'createdAt'>) => Promise<SurveyFolder>;
  updateFolder: (id: string, updates: Partial<SurveyFolder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  getFolderById: (id: string) => SurveyFolder | undefined;
  getSubfolders: (parentId: string | null) => SurveyFolder[];
  assignSurveyToFolder: (surveyId: string, folderId: string | null) => Promise<void>;
  assignFolderToSurveyors: (folderId: string, surveyorIds: string[]) => Promise<void>;
  
  clearError: () => void;
}

const mockFolders: SurveyFolder[] = [
  {
    id: 'folder-1',
    name: 'Satisfacción del Cliente',
    description: 'Encuestas relacionadas con la satisfacción de nuestros clientes',
    createdAt: '2023-09-01T10:00:00Z',
    createdBy: '1',
    parentId: null
  },
  {
    id: 'folder-2',
    name: 'Evaluación de Productos',
    description: 'Encuestas para evaluar nuestros productos',
    createdAt: '2023-09-05T14:00:00Z',
    createdBy: '1',
    parentId: null
  },
  {
    id: 'folder-3',
    name: 'Productos Electrónicos',
    description: 'Subcarpeta para evaluación de productos electrónicos',
    createdAt: '2023-09-06T10:00:00Z',
    createdBy: '1',
    parentId: 'folder-2'
  }
];

const mockSurveys: Survey[] = [
  {
    id: '1',
    title: 'Encuesta de Satisfacción del Cliente',
    description: 'Evaluación mensual sobre la calidad de nuestros productos y servicios',
    questions: [
      {
        id: 'q1',
        text: '¿Cómo calificaría la calidad de nuestro servicio?',
        type: 'multiple-choice',
        options: ['Excelente', 'Bueno', 'Regular', 'Malo', 'Muy malo']
      },
      {
        id: 'q2',
        text: '¿Qué tan probable es que recomiende nuestros productos a otras personas?',
        type: 'multiple-choice',
        options: ['Muy probable', 'Probable', 'Neutral', 'Poco probable', 'Nada probable']
      },
      {
        id: 'q3',
        text: '¿Qué aspecto de nuestro servicio podríamos mejorar?',
        type: 'multiple-choice',
        options: [
          'Atención al cliente', 
          'Calidad del producto', 
          'Precios', 
          'Tiempos de entrega', 
          'Otro'
        ]
      }
    ],
    isActive: true,
    createdAt: '2023-09-15T10:30:00Z',
    createdBy: '1',
    assignedTo: ['2'],
    folderId: 'folder-1',
    collectDemographics: true
  },
  {
    id: '2',
    title: 'Evaluación de Nuevo Producto',
    description: 'Feedback sobre el lanzamiento de nuestro último producto',
    questions: [
      {
        id: 'q1',
        text: '¿Cómo se enteró de nuestro nuevo producto?',
        type: 'multiple-choice',
        options: ['Redes sociales', 'Correo electrónico', 'Recomendación', 'Publicidad', 'Otro']
      },
      {
        id: 'q2',
        text: '¿Qué características le parecen más interesantes?',
        type: 'multiple-choice',
        options: ['Diseño', 'Funcionalidad', 'Precio', 'Innovación', 'Calidad']
      }
    ],
    isActive: true,
    createdAt: '2023-10-05T14:45:00Z',
    createdBy: '1',
    assignedTo: ['2'],
    folderId: 'folder-2',
    collectDemographics: false
  }
];

export const useSurveyStore = create<SurveyState>()(
  persist(
    (set, get) => ({
      surveys: mockSurveys,
      folders: mockFolders,
      responses: [],
      isLoading: false,
      error: null,
      
      fetchSurveys: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Fetch surveys from Supabase
          const { data: surveyData, error: surveyError } = await supabase
            .from('surveys')
            .select('*');
            
          if (surveyError) {
            throw surveyError;
          }
          
          // Fetch folders from Supabase
          const { data: folderData, error: folderError } = await supabase
            .from('survey_folders')
            .select('*');
            
          if (folderError) {
            throw folderError;
          }
          
          // Fetch responses from Supabase
          const { data: responseData, error: responseError } = await supabase
            .from('survey_responses')
            .select('*');
            
          if (responseError) {
            throw responseError;
          }
          
          set({ 
            surveys: surveyData?.length ? surveyData as Survey[] : mockSurveys,
            folders: folderData?.length ? folderData as SurveyFolder[] : mockFolders,
            responses: responseData?.length ? responseData as SurveyResponse[] : [],
            isLoading: false 
          });
        } catch (error) {
          console.error('Error fetching surveys:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al cargar encuestas',
            isLoading: false,
          });
        }
      },
      
      getSurveyById: (id) => {
        return get().surveys.find(survey => survey.id === id);
      },
      
      createSurvey: async (surveyData) => {
        set({ isLoading: true, error: null });
        
        try {
          // Ensure there's an assigned array even if not provided
          const assignedTo = surveyData.assignedTo || [];
          
          // Ensure questions have the correct type
          const questions = surveyData.questions.map(q => ({
            ...q,
            type: q.type || 'multiple-choice',
            options: q.options || []
          }));
          
          const newSurvey: Survey = {
            ...surveyData,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            assignedTo,
            questions,
            // Fix default values if not specified
            isActive: surveyData.isActive !== undefined ? surveyData.isActive : true,
            collectDemographics: surveyData.collectDemographics !== undefined ? surveyData.collectDemographics : true,
            folderId: surveyData.folderId || null
          };
          
          // Insert into Supabase
          const { error } = await supabase
            .from('surveys')
            .insert(newSurvey);
            
          if (error) {
            throw new Error(error.message);
          }
          
          set(state => ({
            surveys: [...state.surveys, newSurvey],
            isLoading: false,
          }));
          
          toast.success('Encuesta creada exitosamente');
          return newSurvey;
        } catch (error) {
          console.error('Error creating survey:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al crear encuesta',
            isLoading: false,
          });
          throw error;
        }
      },
      
      updateSurvey: async (id, updates) => {
        set({ isLoading: true, error: null });
        
        try {
          // Update in Supabase
          const { error } = await supabase
            .from('surveys')
            .update(updates)
            .eq('id', id);
            
          if (error) {
            throw new Error(error.message);
          }
          
          set(state => ({
            surveys: state.surveys.map(survey => 
              survey.id === id ? { ...survey, ...updates } : survey
            ),
            isLoading: false,
          }));
          
          toast.success('Encuesta actualizada exitosamente');
        } catch (error) {
          console.error('Error updating survey:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al actualizar encuesta',
            isLoading: false,
          });
          throw error;
        }
      },
      
      deleteSurvey: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          // Delete from Supabase
          const { error } = await supabase
            .from('surveys')
            .delete()
            .eq('id', id);
            
          if (error) {
            throw new Error(error.message);
          }
          
          // Remove the survey from local state
          set(state => ({
            surveys: state.surveys.filter(survey => survey.id !== id),
            isLoading: false,
          }));
          
          toast.success('Encuesta eliminada correctamente');
        } catch (error) {
          console.error('Error deleting survey:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al eliminar encuesta',
            isLoading: false,
          });
          throw error;
        }
      },
      
      submitResponse: async (responseData) => {
        set({ isLoading: true, error: null });
        
        try {
          const newResponse: SurveyResponse = {
            ...responseData,
            id: uuidv4(),
            completedAt: new Date().toISOString(),
            syncedToServer: navigator.onLine,
          };
          
          // Try to insert into Supabase if online
          if (navigator.onLine) {
            const { error } = await supabase
              .from('survey_responses')
              .insert(newResponse);
              
            if (error) {
              console.error('Error saving response to Supabase:', error);
              newResponse.syncedToServer = false;
            }
          } else {
            // Mark for sync later if offline
            newResponse.syncedToServer = false;
          }
          
          set(state => ({
            responses: [...state.responses, newResponse],
            isLoading: false,
          }));
          
          toast.success('Respuesta guardada exitosamente');
        } catch (error) {
          console.error('Error submitting response:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al enviar respuestas',
            isLoading: false,
          });
          throw error;
        }
      },
      
      getSurveyResponses: (surveyId) => {
        return get().responses.filter(response => response.surveyId === surveyId);
      },
      
      getSurveyorResponses: (surveyorId) => {
        return get().responses.filter(response => response.respondentId === surveyorId);
      },
      
      syncResponses: async () => {
        if (!navigator.onLine) {
          return; // Don't attempt to sync if offline
        }
        
        set({ isLoading: true, error: null });
        
        try {
          // Find all unsynced responses
          const unsyncedResponses = get().responses.filter(r => !r.syncedToServer);
          
          if (unsyncedResponses.length === 0) {
            set({ isLoading: false });
            return;
          }
          
          // Sync each response
          for (const response of unsyncedResponses) {
            const { error } = await supabase
              .from('survey_responses')
              .insert(response);
              
            if (error) {
              console.error(`Error syncing response ${response.id}:`, error);
              // Continue with other responses even if one fails
            }
          }
          
          // Mark responses as synced
          set(state => ({
            responses: state.responses.map(response => 
              !response.syncedToServer ? { ...response, syncedToServer: true } : response
            ),
            isLoading: false,
          }));
          
          toast.success(`${unsyncedResponses.length} respuestas sincronizadas exitosamente`);
        } catch (error) {
          console.error('Error syncing responses:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al sincronizar respuestas',
            isLoading: false,
          });
        }
      },
      
      assignSurvey: async (surveyId, surveyorIds) => {
        set({ isLoading: true, error: null });
        
        try {
          // Update in Supabase
          const { error } = await supabase
            .from('surveys')
            .update({ assignedTo: surveyorIds })
            .eq('id', surveyId);
            
          if (error) {
            throw new Error(error.message);
          }
          
          set(state => ({
            surveys: state.surveys.map(survey =>
              survey.id === surveyId ? { ...survey, assignedTo: surveyorIds } : survey
            ),
            isLoading: false,
          }));
          
          toast.success('Encuesta asignada exitosamente');
        } catch (error) {
          console.error('Error assigning survey:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al asignar encuesta',
            isLoading: false,
          });
          throw error;
        }
      },
      
      createFolder: async (folderData) => {
        set({ isLoading: true, error: null });
        
        try {
          const newFolder: SurveyFolder = {
            ...folderData,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
          };
          
          // Insert into Supabase
          const { error } = await supabase
            .from('survey_folders')
            .insert(newFolder);
            
          if (error) {
            throw new Error(error.message);
          }
          
          set(state => ({
            folders: [...state.folders, newFolder],
            isLoading: false,
          }));
          
          toast.success('Carpeta creada exitosamente');
          return newFolder;
        } catch (error) {
          console.error('Error creating folder:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al crear carpeta',
            isLoading: false,
          });
          throw error;
        }
      },
      
      updateFolder: async (id, updates) => {
        set({ isLoading: true, error: null });
        
        try {
          // Update in Supabase
          const { error } = await supabase
            .from('survey_folders')
            .update(updates)
            .eq('id', id);
            
          if (error) {
            throw new Error(error.message);
          }
          
          set(state => ({
            folders: state.folders.map(folder => 
              folder.id === id ? { ...folder, ...updates } : folder
            ),
            isLoading: false,
          }));
          
          toast.success('Carpeta actualizada exitosamente');
        } catch (error) {
          console.error('Error updating folder:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al actualizar carpeta',
            isLoading: false,
          });
          throw error;
        }
      },
      
      deleteFolder: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          // Get all subfolders recursively
          const allSubfolderIds = new Set<string>();
          
          const getAllSubfolderIds = (folderId: string) => {
            const subfolders = get().folders.filter(f => f.parentId === folderId);
            subfolders.forEach(folder => {
              allSubfolderIds.add(folder.id);
              getAllSubfolderIds(folder.id);
            });
          };
          
          getAllSubfolderIds(id);
          const foldersToDelete = [id, ...Array.from(allSubfolderIds)];
          
          // Delete from Supabase
          for (const folderId of foldersToDelete) {
            const { error } = await supabase
              .from('survey_folders')
              .delete()
              .eq('id', folderId);
              
            if (error) {
              console.error(`Error deleting folder ${folderId}:`, error);
            }
          }
          
          // Update surveys that reference the deleted folders
          const surveysToUpdate = get().surveys.filter(s => foldersToDelete.includes(s.folderId || ''));
          
          for (const survey of surveysToUpdate) {
            await supabase
              .from('surveys')
              .update({ folderId: null })
              .eq('id', survey.id);
          }
          
          // Update local state
          set(state => ({
            folders: state.folders.filter(folder => !foldersToDelete.includes(folder.id)),
            surveys: state.surveys.map(survey => 
              foldersToDelete.includes(survey.folderId || '') ? { ...survey, folderId: null } : survey
            ),
            isLoading: false,
          }));
          
          toast.success('Carpeta eliminada exitosamente');
        } catch (error) {
          console.error('Error deleting folder:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al eliminar carpeta',
            isLoading: false,
          });
          throw error;
        }
      },
      
      getFolderById: (id) => {
        return get().folders.find(folder => folder.id === id);
      },
      
      getSubfolders: (parentId) => {
        return get().folders.filter(folder => folder.parentId === parentId);
      },
      
      assignSurveyToFolder: async (surveyId, folderId) => {
        set({ isLoading: true, error: null });
        
        try {
          // Update in Supabase
          const { error } = await supabase
            .from('surveys')
            .update({ folderId })
            .eq('id', surveyId);
            
          if (error) {
            throw new Error(error.message);
          }
          
          set(state => ({
            surveys: state.surveys.map(survey => 
              survey.id === surveyId ? { ...survey, folderId } : survey
            ),
            isLoading: false,
          }));
          
          toast.success('Encuesta asignada a carpeta exitosamente');
        } catch (error) {
          console.error('Error assigning survey to folder:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al asignar encuesta a carpeta',
            isLoading: false,
          });
          throw error;
        }
      },
      
      assignFolderToSurveyors: async (folderId, surveyorIds) => {
        set({ isLoading: true, error: null });
        
        try {
          // When assigning a folder to surveyors, assign all surveys in that folder to those surveyors
          const folderSurveys = get().surveys.filter(survey => survey.folderId === folderId);
          
          // Update each survey in Supabase
          for (const survey of folderSurveys) {
            const { error } = await supabase
              .from('surveys')
              .update({ assignedTo: surveyorIds })
              .eq('id', survey.id);
              
            if (error) {
              console.error(`Error assigning survey ${survey.id} to surveyors:`, error);
            }
          }
          
          // Update local state
          const updatedSurveys = get().surveys.map(survey => {
            if (survey.folderId === folderId) {
              return { ...survey, assignedTo: surveyorIds };
            }
            return survey;
          });
          
          set(state => ({
            surveys: updatedSurveys,
            isLoading: false,
          }));
          
          toast.success('Carpeta asignada a encuestadores exitosamente');
        } catch (error) {
          console.error('Error assigning folder to surveyors:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al asignar carpeta a encuestadores',
            isLoading: false,
          });
          throw error;
        }
      },
      
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'encuestas-va-surveys',
      partialize: (state) => ({
        surveys: state.surveys,
        folders: state.folders,
        responses: state.responses,
      }),
    }
  )
);
