
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Download, Upload } from 'lucide-react';
import { saveAs } from 'file-saver';
import { useIsMobile } from '@/hooks/use-mobile';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface ExcelQuestion {
  text: string;
  type: 'multiple-choice' | 'free-text';
  options?: string;
  dependsOn?: string;
  showWhen?: string[];
}

export function ExcelImporter({ onImport }: { onImport: (questions: any[]) => void }) {
  const isMobile = useIsMobile();
  
  const downloadTemplate = () => {
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Create template data with Spanish headers and examples
    const templateData = [
      ['Número', 'Texto de la Pregunta', 'Tipo', 'Opciones (separadas por ;)', 'Depende de pregunta #', 'Mostrar cuando (separado por ;)'],
      ['1', '¿Qué le pareció el servicio?', 'multiple-choice', 'Excelente;Bueno;Regular;Malo', '', ''],
      ['2', '¿Por qué eligió esta respuesta?', 'free-text', '', '1', 'Malo;Regular'],
      ['3', '¿Recomendaría nuestro servicio?', 'multiple-choice', 'Sí, definitivamente;Probablemente;No estoy seguro;No', '', ''],
      ['4', '¿Qué podríamos mejorar?', 'free-text', '', '3', 'No estoy seguro;No'],
    ];
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    
    // Generate file and trigger download
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'plantilla_encuesta.xlsx');
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convert to JSON with appropriate headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: ['order', 'text', 'type', 'options', 'dependsOn', 'showWhen']
        });
        
        // Skip header row
        const questionsData = jsonData.slice(1);
        
        // Sort by order column if it exists
        const sortedData = questionsData.sort((a: any, b: any) => {
          // If both have valid order numbers, sort by them
          if (!isNaN(Number(a.order)) && !isNaN(Number(b.order))) {
            return Number(a.order) - Number(b.order);
          }
          // If only a has valid order, it goes first
          if (!isNaN(Number(a.order))) return -1;
          // If only b has valid order, it goes first
          if (!isNaN(Number(b.order))) return 1;
          // If neither has order, maintain original order
          return 0;
        });

        // Create a map of order to id for conditional logic
        const orderToId = new Map<number, string>();
        
        // First pass: create questions and map order numbers to IDs
        const questions = sortedData.map((row: any, index: number) => {
          if (!row.text || !row.type) {
            throw new Error('Todas las preguntas deben tener texto y tipo');
          }
          
          if (row.type !== 'multiple-choice' && row.type !== 'free-text') {
            throw new Error(`Tipo de pregunta inválido: ${row.type}`);
          }
          
          const question: any = {
            id: `q${index + 1}`,
            text: row.text,
            type: row.type,
          };
          
          // Store the mapping of order to question id
          if (row.order && !isNaN(Number(row.order))) {
            orderToId.set(Number(row.order), question.id);
          }
          
          if (row.type === 'multiple-choice') {
            if (!row.options) {
              throw new Error('Las preguntas de opción múltiple deben tener opciones');
            }
            
            question.options = row.options.split(';').filter(Boolean);
            
            if (question.options.length < 2) {
              throw new Error('Las preguntas de opción múltiple deben tener al menos 2 opciones');
            }
          } else {
            question.options = [];
          }
          
          return question;
        });
        
        // Second pass: add conditional logic
        questions.forEach((question: any, index: number) => {
          const row = sortedData[index];
          
          // Handle conditional logic
          if (row.dependsOn && !isNaN(Number(row.dependsOn))) {
            const parentQuestionId = orderToId.get(Number(row.dependsOn));
            if (parentQuestionId) {
              question.dependsOn = parentQuestionId;
              
              // Handle showWhen conditions
              if (row.showWhen) {
                question.showWhen = row.showWhen.split(';').filter(Boolean);
              }
            }
          }
        });
        
        onImport(questions);
        toast.success(`${questions.length} preguntas importadas correctamente`);
      } catch (error) {
        console.error('Error importing survey:', error);
        toast.error(error instanceof Error ? error.message : 'Error al importar la encuesta');
      }
    };
    
    reader.readAsArrayBuffer(file);
  };
  
  return (
    <div className="space-y-4">
      <ToggleGroup type="single" className="justify-start">
        <ToggleGroupItem value="import" asChild>
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "default"}
            className="text-admin border-admin hover:bg-admin/10"
            onClick={() => document.getElementById('excel-upload')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isMobile ? "Importar" : "Importar Excel"}
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="excel-upload"
            />
          </Button>
        </ToggleGroupItem>
        
        <ToggleGroupItem value="download" asChild>
          <Button 
            variant="outline"
            size={isMobile ? "sm" : "default"}
            className="text-admin border-admin hover:bg-admin/10"
            onClick={downloadTemplate}
          >
            <Download className="h-4 w-4 mr-2" />
            {isMobile ? "Plantilla" : "Descargar Plantilla"}
          </Button>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
