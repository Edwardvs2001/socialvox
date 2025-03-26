
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'multiple-choice' | 'free-text';
  options: string[];
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
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  respondentId: string;
  answers: { questionId: string; selectedOption: string; textAnswer?: string }[];
  audioRecording: string | null;
  completedAt: string;
  syncedToServer: boolean;
}

interface SurveyState {
  surveys: Survey[];
  responses: SurveyResponse[];
  isLoading: boolean;
  error: string | null;
  
  // Survey CRUD operations
  fetchSurveys: () => Promise<void>;
  getSurveyById: (id: string) => Survey | undefined;
  createSurvey: (survey: Omit<Survey, 'id' | 'createdAt'>) => Promise<Survey>;
  updateSurvey: (id: string, updates: Partial<Survey>) => Promise<void>;
  deleteSurvey: (id: string) => Promise<void>;
  
  // Response operations
  submitResponse: (response: Omit<SurveyResponse, 'id' | 'completedAt' | 'syncedToServer'>) => Promise<void>;
  getSurveyResponses: (surveyId: string) => SurveyResponse[];
  getSurveyorResponses: (surveyorId: string) => SurveyResponse[];
  syncResponses: () => Promise<void>;
  
  // Assign surveys
  assignSurvey: (surveyId: string, surveyorIds: string[]) => Promise<void>;
  
  // Utility
  clearError: () => void;
}

// Mock data
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
    createdBy: '1', // admin ID
    assignedTo: ['2'] // surveyor ID
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
    assignedTo: ['2']
  }
];

export const useSurveyStore = create<SurveyState>()(
  persist(
    (set, get) => ({
      surveys: mockSurveys,
      responses: [],
      isLoading: false,
      error: null,
      
      fetchSurveys: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // In a real app, this would be an API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // We're using the mock data directly
          set({ isLoading: false });
        } catch (error) {
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
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const newSurvey: Survey = {
            ...surveyData,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
          };
          
          set(state => ({
            surveys: [...state.surveys, newSurvey],
            isLoading: false,
          }));
          
          return newSurvey;
        } catch (error) {
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
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 800));
          
          set(state => ({
            surveys: state.surveys.map(survey => 
              survey.id === id ? { ...survey, ...updates } : survey
            ),
            isLoading: false,
          }));
        } catch (error) {
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
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 800));
          
          set(state => ({
            surveys: state.surveys.filter(survey => survey.id !== id),
            isLoading: false,
          }));
        } catch (error) {
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
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const newResponse: SurveyResponse = {
            ...responseData,
            id: uuidv4(),
            completedAt: new Date().toISOString(),
            syncedToServer: navigator.onLine, // Mark as synced if online
          };
          
          set(state => ({
            responses: [...state.responses, newResponse],
            isLoading: false,
          }));
        } catch (error) {
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
          
          // Simulate API call to sync responses
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Mark responses as synced
          set(state => ({
            responses: state.responses.map(response => 
              !response.syncedToServer ? { ...response, syncedToServer: true } : response
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error al sincronizar respuestas',
            isLoading: false,
          });
        }
      },
      
      assignSurvey: async (surveyId, surveyorIds) => {
        set({ isLoading: true, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 700));
          
          set(state => ({
            surveys: state.surveys.map(survey =>
              survey.id === surveyId ? { ...survey, assignedTo: surveyorIds } : survey
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error al asignar encuesta',
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
        responses: state.responses,
      }),
    }
  )
);
