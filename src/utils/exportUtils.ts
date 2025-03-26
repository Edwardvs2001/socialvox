
import { SurveyResponse, Survey } from '@/store/surveyStore';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

/**
 * Exporta los resultados de la encuesta como un archivo Excel con formato adecuado
 */
export const exportResultsToExcel = (survey: Survey, responses: SurveyResponse[]): void => {
  // Crear libro de trabajo y hoja de cálculo
  const workbook = XLSX.utils.book_new();
  
  // Formatear encabezados
  const headers = ['ID', 'Encuestado', 'Fecha de Finalización'];
  
  // Añadir encabezados de preguntas
  survey.questions.forEach(question => {
    headers.push(question.text);
  });
  
  // Añadir columna 'Tiene Audio'
  headers.push('Tiene Audio');
  
  // Crear filas de datos
  const rows = responses.map((response, index) => {
    const row = [
      (index + 1).toString(),
      `Encuestado ${index + 1}`,
      new Date(response.completedAt).toLocaleString()
    ];
    
    // Añadir respuestas para cada pregunta
    survey.questions.forEach(question => {
      const answer = response.answers.find(a => a.questionId === question.id);
      if (answer) {
        if (question.type === 'multiple-choice') {
          row.push(answer.selectedOption);
        } else if (question.type === 'free-text' && answer.textAnswer) {
          row.push(answer.textAnswer);
        } else {
          row.push('');
        }
      } else {
        row.push('');
      }
    });
    
    // Añadir si hay audio
    row.push(response.audioRecording ? 'Sí' : 'No');
    
    return row;
  });
  
  // Crear hoja de cálculo con datos
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  
  // Establecer anchos de columna
  const colWidths = [];
  headers.forEach((header, i) => {
    const maxLength = Math.max(
      header.length,
      ...rows.map(row => String(row[i] || '').length)
    );
    colWidths.push({ wch: Math.min(Math.max(10, maxLength + 2), 50) });
  });
  
  worksheet['!cols'] = colWidths;
  
  // Aplicar estilo a encabezados - hacerlos negrita con color de fondo
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!worksheet[address]) continue;
    
    worksheet[address].s = {
      fill: { fgColor: { rgb: "DDEBF7" } },
      font: { bold: true },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }
  
  // Añadir hoja de cálculo al libro de trabajo
  XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados de Encuesta");
  
  // Aplicar estilo de tabla al conjunto de datos completo
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  worksheet['!autofilter'] = { ref: worksheet['!ref'] || 'A1' };
  
  // Alternar colores de fila para mejor legibilidad
  for (let R = 1; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[address]) continue;
      
      worksheet[address].s = {
        fill: { fgColor: { rgb: R % 2 ? "FFFFFF" : "F5F5F5" } },
        alignment: { vertical: "center" }
      };
    }
  }
  
  // Generar nombre de archivo basado en el título de la encuesta y la fecha actual
  const fileName = `${survey.title.replace(/\s+/g, '_')}_resultados_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  // Escribir y guardar el archivo Excel
  XLSX.writeFile(workbook, fileName);
};

/**
 * Exporta los resultados de la encuesta como un archivo CSV
 */
export const exportResultsToCSV = (survey: Survey, responses: SurveyResponse[]): void => {
  // Comenzar con encabezados
  const headers = ['ID', 'Encuestado', 'Fecha de Finalización'];
  
  // Añadir encabezados de preguntas
  survey.questions.forEach(question => {
    headers.push(question.text.replace(/,/g, ' '));
  });
  
  // Añadir columna 'Tiene Audio'
  headers.push('Tiene Audio');
  
  // Crear filas CSV
  const rows = responses.map((response, index) => {
    const row = [
      (index + 1).toString(),
      `Encuestado ${index + 1}`,
      response.completedAt
    ];
    
    // Añadir respuestas para cada pregunta
    survey.questions.forEach(question => {
      const answer = response.answers.find(a => a.questionId === question.id);
      if (answer) {
        if (question.type === 'multiple-choice') {
          row.push(answer.selectedOption.replace(/,/g, ' '));
        } else if (question.type === 'free-text' && answer.textAnswer) {
          row.push(answer.textAnswer.replace(/,/g, ' '));
        } else {
          row.push('');
        }
      } else {
        row.push('');
      }
    });
    
    // Añadir si hay audio
    row.push(response.audioRecording ? 'Sí' : 'No');
    
    return row;
  });
  
  // Combinar encabezados y filas
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Crear blob y descargar archivo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fileName = `${survey.title.replace(/\s+/g, '_')}_resultados_${new Date().toISOString().split('T')[0]}.csv`;
  saveAs(blob, fileName);
};

/**
 * Exporta todas las grabaciones de audio como un archivo zip
 */
export const exportAudioRecordings = async (survey: Survey, responses: SurveyResponse[]): Promise<void> => {
  // Filtrar respuestas con grabaciones de audio
  const recordingsResponses = responses.filter(r => r.audioRecording);
  
  if (recordingsResponses.length === 0) {
    console.warn('No se encontraron grabaciones de audio para exportar');
    return;
  }
  
  // Si hay solo una grabación, descargarla directamente
  if (recordingsResponses.length === 1) {
    const response = recordingsResponses[0];
    if (response.audioRecording) {
      // Extraer extensión de archivo (usualmente webm)
      const extension = response.audioRecording.split(';')[0].split('/')[1];
      const fileName = `grabacion_1.${extension || 'webm'}`;
      
      // Convertir URL de datos a Blob y descargar
      const blob = await fetch(response.audioRecording).then(r => r.blob());
      saveAs(blob, fileName);
    }
    return;
  }
  
  // Para múltiples grabaciones, crear un archivo zip
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  
  // Añadir cada grabación al zip
  const promises = recordingsResponses.map(async (response, index) => {
    if (response.audioRecording) {
      const extension = response.audioRecording.split(';')[0].split('/')[1] || 'webm';
      const fileName = `grabacion_${index + 1}.${extension}`;
      
      try {
        const blob = await fetch(response.audioRecording).then(r => r.blob());
        zip.file(fileName, blob);
      } catch (error) {
        console.error(`Error al añadir grabación ${index} al zip:`, error);
      }
    }
  });
  
  // Esperar a que todas las grabaciones se añadan al zip
  await Promise.all(promises);
  
  // Generar y descargar el archivo zip
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipFileName = `${survey.title.replace(/\s+/g, '_')}_grabaciones_${new Date().toISOString().split('T')[0]}.zip`;
  saveAs(zipBlob, zipFileName);
};
