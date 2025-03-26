
import { useState, useEffect } from 'react';
import { GeoLocation } from '@/store/surveyStore';

export const useGeolocation = () => {
  const [location, setLocation] = useState<GeoLocation>({
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: 'La geolocalización no está soportada en este dispositivo',
      }));
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        });
        setPermissionStatus('granted');
        setIsLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocation(prev => ({
          ...prev,
          error: getGeolocationErrorMessage(error.code),
        }));
        setPermissionStatus(error.code === 1 ? 'denied' : 'unknown');
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Check for permissions when the component mounts
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
        
        if (result.state === 'granted') {
          getCurrentPosition();
        }
        
        result.onchange = () => {
          setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
        };
      });
    } else {
      // For browsers that don't support permission API, just try to get position
      getCurrentPosition();
    }
  }, []);

  return {
    location,
    isLoading,
    permissionStatus,
    getCurrentPosition,
  };
};

function getGeolocationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return 'Permiso de ubicación denegado. Por favor, concede permisos para continuar.';
    case 2:
      return 'No se pudo obtener la ubicación. Verifica tu conexión a internet y GPS.';
    case 3:
      return 'Tiempo de espera agotado al obtener la ubicación.';
    default:
      return 'Error desconocido al obtener la ubicación.';
  }
}
