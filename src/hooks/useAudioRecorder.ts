
import { useState, useRef, useCallback, useEffect } from 'react';

interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
}

export function useAudioRecorder() {
  const [recorderState, setRecorderState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    audioBlob: null,
    audioUrl: null,
  });
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const mediaChunks = useRef<Blob[]>([]);
  const timerInterval = useRef<number | null>(null);
  
  // Start recording function
  const startRecording = useCallback(async () => {
    try {
      // Reset state
      mediaChunks.current = [];
      setRecorderState(prevState => ({
        ...prevState,
        isRecording: false,
        isPaused: false,
        recordingTime: 0,
        audioBlob: null,
        audioUrl: null,
      }));
      
      // Request permission to use audio
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      
      // Add event listeners
      recorder.addEventListener('dataavailable', (e) => {
        if (e.data.size > 0) {
          mediaChunks.current.push(e.data);
        }
      });
      
      recorder.addEventListener('stop', () => {
        // Create blob and URL
        const audioBlob = new Blob(mediaChunks.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setRecorderState(prevState => ({
          ...prevState,
          isRecording: false,
          isPaused: false,
          audioBlob,
          audioUrl,
        }));
        
        // Stop all audio tracks to release the microphone
        stream.getAudioTracks().forEach(track => track.stop());
      });
      
      // Start recording
      recorder.start(100); // Collect data every 100ms
      
      // Update state and start timer
      setRecorderState(prevState => ({
        ...prevState,
        isRecording: true,
        isPaused: false,
      }));
      
      // Set up timer
      let recordingTimer = 0;
      timerInterval.current = window.setInterval(() => {
        recordingTimer++;
        setRecorderState(prevState => ({
          ...prevState,
          recordingTime: recordingTimer,
        }));
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('No se pudo acceder al micrófono. Por favor, verifique los permisos.');
    }
  }, []);
  
  // Pause recording function
  const pauseRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.pause();
      
      // Clear interval
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
      
      setRecorderState(prevState => ({
        ...prevState,
        isRecording: true,
        isPaused: true,
      }));
    }
  }, []);
  
  // Resume recording function
  const resumeRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'paused') {
      mediaRecorder.current.resume();
      
      // Restart timer
      let recordingTimer = recorderState.recordingTime;
      timerInterval.current = window.setInterval(() => {
        recordingTimer++;
        setRecorderState(prevState => ({
          ...prevState,
          recordingTime: recordingTimer,
        }));
      }, 1000);
      
      setRecorderState(prevState => ({
        ...prevState,
        isRecording: true,
        isPaused: false,
      }));
    }
  }, [recorderState.recordingTime]);
  
  // Stop recording function
  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && 
        (mediaRecorder.current.state === 'recording' || 
         mediaRecorder.current.state === 'paused')) {
      mediaRecorder.current.stop();
      
      // Clear interval
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
    }
  }, []);
  
  // Format recording time (MM:SS)
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);
  
  // Cleanup function
  useEffect(() => {
    return () => {
      // Clear interval
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      
      // Stop media recorder if active
      if (mediaRecorder.current && 
          (mediaRecorder.current.state === 'recording' || 
           mediaRecorder.current.state === 'paused')) {
        mediaRecorder.current.stop();
      }
      
      // Revoke object URL if exists
      if (recorderState.audioUrl) {
        URL.revokeObjectURL(recorderState.audioUrl);
      }
    };
  }, [recorderState.audioUrl]);
  
  return {
    ...recorderState,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    formattedTime: formatTime(recorderState.recordingTime),
  };
}
