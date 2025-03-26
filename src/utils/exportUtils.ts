
import { SurveyResponse, Survey } from '@/store/surveyStore';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

/**
 * Exports survey results as an Excel file with proper formatting
 */
export const exportResultsToExcel = (survey: Survey, responses: SurveyResponse[]): void => {
  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  
  // Format headers
  const headers = ['ID', 'Respondent', 'Completed At'];
  
  // Add question headers
  survey.questions.forEach(question => {
    headers.push(question.text);
  });
  
  // Add 'Has Audio' column
  headers.push('Has Audio');
  
  // Create data rows
  const rows = responses.map((response, index) => {
    const row = [
      (index + 1).toString(),
      `Encuestado ${index + 1}`,
      new Date(response.completedAt).toLocaleString()
    ];
    
    // Add answers for each question
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
    
    // Add whether there's audio
    row.push(response.audioRecording ? 'Yes' : 'No');
    
    return row;
  });
  
  // Create worksheet with data
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  
  // Set column widths
  const colWidths = [];
  headers.forEach((header, i) => {
    const maxLength = Math.max(
      header.length,
      ...rows.map(row => String(row[i] || '').length)
    );
    colWidths.push({ wch: Math.min(Math.max(10, maxLength + 2), 50) });
  });
  
  worksheet['!cols'] = colWidths;
  
  // Apply styling to headers - make them bold with background color
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
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Survey Results");
  
  // Apply table style to the whole dataset
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  worksheet['!autofilter'] = { ref: worksheet['!ref'] || 'A1' };
  
  // Alternate row colors for better readability
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
  
  // Generate filename based on survey title and current date
  const fileName = `${survey.title.replace(/\s+/g, '_')}_results_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  // Write and save the Excel file
  XLSX.writeFile(workbook, fileName);
};

/**
 * Exports survey results as a CSV file
 */
export const exportResultsToCSV = (survey: Survey, responses: SurveyResponse[]): void => {
  // Start with headers
  const headers = ['ID', 'Respondent', 'Completed At'];
  
  // Add question headers
  survey.questions.forEach(question => {
    headers.push(question.text.replace(/,/g, ' '));
  });
  
  // Add 'Has Audio' column
  headers.push('Has Audio');
  
  // Create CSV rows
  const rows = responses.map((response, index) => {
    const row = [
      (index + 1).toString(),
      `Encuestado ${index + 1}`,
      response.completedAt
    ];
    
    // Add answers for each question
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
    
    // Add whether there's audio
    row.push(response.audioRecording ? 'Yes' : 'No');
    
    return row;
  });
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Create blob and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fileName = `${survey.title.replace(/\s+/g, '_')}_results_${new Date().toISOString().split('T')[0]}.csv`;
  saveAs(blob, fileName);
};

/**
 * Exports all audio recordings as a zip file
 */
export const exportAudioRecordings = async (survey: Survey, responses: SurveyResponse[]): Promise<void> => {
  // Filter responses with audio recordings
  const recordingsResponses = responses.filter(r => r.audioRecording);
  
  if (recordingsResponses.length === 0) {
    console.warn('No audio recordings found to export');
    return;
  }
  
  // If there's only one recording, download it directly
  if (recordingsResponses.length === 1) {
    const response = recordingsResponses[0];
    if (response.audioRecording) {
      // Extract file extension (usually webm)
      const extension = response.audioRecording.split(';')[0].split('/')[1];
      const fileName = `recording_1.${extension || 'webm'}`;
      
      // Convert Data URL to Blob and download
      const blob = await fetch(response.audioRecording).then(r => r.blob());
      saveAs(blob, fileName);
    }
    return;
  }
  
  // For multiple recordings, create a zip file
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  
  // Add each recording to the zip
  const promises = recordingsResponses.map(async (response, index) => {
    if (response.audioRecording) {
      const extension = response.audioRecording.split(';')[0].split('/')[1] || 'webm';
      const fileName = `recording_${index + 1}.${extension}`;
      
      try {
        const blob = await fetch(response.audioRecording).then(r => r.blob());
        zip.file(fileName, blob);
      } catch (error) {
        console.error(`Error adding recording ${index} to zip:`, error);
      }
    }
  });
  
  // Wait for all recordings to be added to zip
  await Promise.all(promises);
  
  // Generate and download the zip file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipFileName = `${survey.title.replace(/\s+/g, '_')}_recordings_${new Date().toISOString().split('T')[0]}.zip`;
  saveAs(zipBlob, zipFileName);
};
