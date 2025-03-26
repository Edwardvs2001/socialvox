
/**
 * Utilidad para obtener la dirección a partir de coordenadas (geocodificación inversa)
 */

/**
 * Obtiene la dirección a partir de las coordenadas utilizando la API de Nominatim (OpenStreetMap)
 * @param latitude Latitud
 * @param longitude Longitud
 * @returns Promesa que resuelve a la dirección
 */
export const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
  try {
    // Usamos la API libre de Nominatim (OpenStreetMap) para la geocodificación inversa
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      { 
        headers: {
          'Accept-Language': 'es',
          'User-Agent': 'EncuestasVA/1.0' // Importante incluir un User-Agent para Nominatim
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error de geocodificación: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    // Formateamos la dirección según los componentes disponibles
    if (data.display_name) {
      return data.display_name;
    } else if (data.address) {
      const address = data.address;
      const components = [];
      
      // Agregamos componentes si existen
      if (address.road) components.push(address.road);
      if (address.house_number) components.push(address.house_number);
      if (address.suburb) components.push(address.suburb);
      if (address.city) components.push(address.city);
      else if (address.town) components.push(address.town);
      else if (address.village) components.push(address.village);
      if (address.state) components.push(address.state);
      if (address.country) components.push(address.country);
      
      return components.join(', ');
    }
    
    return 'Dirección no disponible';
  } catch (error) {
    console.error('Error en geocodificación inversa:', error);
    return 'Error al obtener la dirección';
  }
};
