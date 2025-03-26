
// Mock API utility functions
import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

// Default timezone (Lima, Peru)
export const DEFAULT_TIMEZONE = "America/Lima";

// Simulate network latency
export const simulateNetworkDelay = async (minMs = 300, maxMs = 1200): Promise<void> => {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Simulate network error with a defined probability
export const simulateNetworkErrorConditionally = async (errorProbability = 0.1): Promise<void> => {
  if (Math.random() < errorProbability) {
    throw new Error('Error de red simulado');
  }
};

// Utility to convert Blob to Base64 (for storing audio recordings)
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Utility to convert Base64 to Blob (for loading audio recordings)
export const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteArrays = [];
  
  for (let i = 0; i < byteCharacters.length; i += 512) {
    const slice = byteCharacters.slice(i, i + 512);
    
    const byteNumbers = new Array(slice.length);
    for (let j = 0; j < slice.length; j++) {
      byteNumbers[j] = slice.charCodeAt(j);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: mimeType });
};

// Format date with timezone support
export const formatDate = (dateString: string, timezone = DEFAULT_TIMEZONE): string => {
  const date = parseISO(dateString);
  return formatInTimeZone(
    date,
    timezone,
    "d 'de' MMMM 'de' yyyy, HH:mm"
  );
};

// Format date short with timezone support
export const formatDateShort = (dateString: string, timezone = DEFAULT_TIMEZONE): string => {
  const date = parseISO(dateString);
  return formatInTimeZone(
    date,
    timezone,
    "dd/MM/yyyy"
  );
};

// Get current date and time in Lima timezone
export const getCurrentLimaDateTime = (): Date => {
  const now = new Date();
  return new Date(formatInTimeZone(now, DEFAULT_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"));
};

// Format date with custom format and timezone
export const formatDateWithFormat = (
  dateString: string, 
  formatStr: string = "PPP", 
  timezone = DEFAULT_TIMEZONE
): string => {
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  return formatInTimeZone(date, timezone, formatStr);
};
