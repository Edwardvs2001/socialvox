
import { SurveyResponse, Survey } from '@/store/surveyStore';
import { saveAs } from 'file-saver';

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
  const rows = responses.map(response => {
    const row = [
      response.id,
      response.respondentId,
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
      const fileName = `recording_${response.id}.${extension || 'webm'}`;
      
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
      const fileName = `recording_${response.id}.${extension}`;
      
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

