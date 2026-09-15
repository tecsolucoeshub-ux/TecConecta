export interface CepLocationResult {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  formattedAddress: string;
  source: 'brasilapi' | 'awesomeapi' | 'google' | 'nominatim' | 'city_centroid';
}

// Fallback centroids for major Brazilian capitals/cities
const CITY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  'rio verde': { lat: -17.7915, lng: -50.9201 },
  'são paulo': { lat: -23.55052, lng: -46.633308 },
  'rio de janeiro': { lat: -22.906847, lng: -43.172896 },
  'belo horizonte': { lat: -19.916681, lng: -43.934493 },
  'curitiba': { lat: -25.428954, lng: -49.267137 },
  'salvador': { lat: -12.971599, lng: -38.501594 },
  'brasília': { lat: -15.7975, lng: -47.8919 },
  'fortaleza': { lat: -3.731862, lng: -38.52667 },
  'recife': { lat: -8.047562, lng: -34.876964 },
  'porto alegre': { lat: -30.034647, lng: -51.217659 },
  'campinas': { lat: -22.90556, lng: -47.06083 },
  'goiânia': { lat: -16.686891, lng: -49.264794 },
  'manaus': { lat: -3.119028, lng: -60.021731 },
  'florianópolis': { lat: -27.595378, lng: -48.54805 },
  'vitória': { lat: -20.3155, lng: -40.3128 }
};

/**
 * Geocode an address using Google Maps JavaScript API Geocoder or OpenStreetMap Nominatim.
 */
export async function geocodeTextAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  // 1. Try Google Maps Geocoder if API is initialized in browser
  if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
    try {
      const geocoder = new (window as any).google.maps.Geocoder();
      const res = await new Promise<any>((resolve, reject) => {
        geocoder.geocode({ address, region: 'br' }, (results: any, status: any) => {
          if (status === 'OK' && results && results[0]) {
            resolve(results[0]);
          } else {
            reject(new Error(status));
          }
        });
      });
      if (res?.geometry?.location) {
        return {
          lat: Number(res.geometry.location.lat()),
          lng: Number(res.geometry.location.lng())
        };
      }
    } catch (e) {
      console.warn('Google Maps Geocoder fallback:', e);
    }
  }

  // 2. Try Nominatim Geocoding
  try {
    const encoded = encodeURIComponent(`${address}, Brasil`);
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`, {
      headers: { 'User-Agent': 'TecConecta-App/1.0' }
    });
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        return {
          lat: Number(data[0].lat),
          lng: Number(data[0].lon)
        };
      }
    }
  } catch (err) {
    console.warn('Nominatim geocode failed:', err);
  }

  return null;
}

/**
 * Geocode directly by CEP postal code
 */
export async function geocodePostalCode(cleanCep: string): Promise<{ lat: number; lng: number } | null> {
  // Try Google Geocoder with postal code
  if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
    try {
      const geocoder = new (window as any).google.maps.Geocoder();
      const res = await new Promise<any>((resolve, reject) => {
        geocoder.geocode({ address: `${cleanCep}, Brasil`, componentRestrictions: { country: 'BR' } }, (results: any, status: any) => {
          if (status === 'OK' && results && results[0]) {
            resolve(results[0]);
          } else {
            reject(new Error(status));
          }
        });
      });
      if (res?.geometry?.location) {
        return {
          lat: Number(res.geometry.location.lat()),
          lng: Number(res.geometry.location.lng())
        };
      }
    } catch (e) {
      console.warn('Google Maps postalCode geocode fallback:', e);
    }
  }

  // Try Nominatim with postalcode parameter
  try {
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&postalcode=${cleanCep}&country=Brazil&limit=1`, {
      headers: { 'User-Agent': 'TecConecta-App/1.0' }
    });
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
        return {
          lat: Number(data[0].lat),
          lng: Number(data[0].lon)
        };
      }
    }
  } catch (err) {
    console.warn('Nominatim postalcode geocode failed:', err);
  }

  return null;
}

/**
 * Fetch Brazilian CEP and automatically detect full address & geocoordinates faithful to the registered CEP.
 */
export async function fetchAddressByCep(rawCep: string): Promise<CepLocationResult> {
  const cleanCep = rawCep.replace(/\D/g, '');
  if (cleanCep.length !== 8) {
    throw new Error('CEP deve conter exatamente 8 dígitos.');
  }

  let street = '';
  let neighborhood = '';
  let city = '';
  let state = '';
  let lat = 0;
  let lng = 0;
  let source: CepLocationResult['source'] = 'brasilapi';

  // 1. Try AwesomeAPI CEP service (frequently contains direct lat/lng for Brazilian postal codes)
  try {
    const awesomeRes = await fetch(`https://cep.awesomeapi.com.br/json/${cleanCep}`);
    if (awesomeRes.ok) {
      const aData = await awesomeRes.json();
      if (aData.address) street = aData.address;
      if (aData.district) neighborhood = aData.district;
      if (aData.city) city = aData.city;
      if (aData.state) state = aData.state;
      if (aData.lat && aData.lng && !isNaN(Number(aData.lat)) && !isNaN(Number(aData.lng))) {
        lat = Number(aData.lat);
        lng = Number(aData.lng);
        source = 'awesomeapi';
      }
    }
  } catch (e) {
    console.warn('AwesomeAPI CEP check:', e);
  }

  // 2. Try BrasilAPI v2 (includes direct high-accuracy coordinates when available)
  if (!city || !lat || !lng) {
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
      if (res.ok) {
        const data = await res.json();
        if (!street && data.street) street = data.street;
        if (!neighborhood && data.neighborhood) neighborhood = data.neighborhood;
        if (!city && data.city) city = data.city;
        if (!state && data.state) state = data.state;

        if (data.location?.coordinates?.latitude && data.location?.coordinates?.longitude) {
          lat = Number(data.location.coordinates.latitude);
          lng = Number(data.location.coordinates.longitude);
          source = 'brasilapi';
        }
      }
    } catch (err) {
      console.warn('BrasilAPI request failed:', err);
    }
  }

  // 3. If still missing address info, try ViaCEP fallback
  if (!city) {
    try {
      const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (viaCepRes.ok) {
        const data = await viaCepRes.json();
        if (!data.erro) {
          if (!street) street = data.logradouro || '';
          if (!neighborhood) neighborhood = data.bairro || '';
          if (!city) city = data.localidade || '';
          if (!state) state = data.uf || '';
        }
      }
    } catch (err) {
      console.warn('ViaCEP request failed:', err);
    }
  }

  if (!city) {
    throw new Error('CEP não encontrado. Por favor, confira os números digitados.');
  }

  // 4. If exact coordinates were not yet returned directly by the CEP services,
  // geocode specifically by the postal code and resolved address
  if (!lat || !lng) {
    // 4a. First try geocoding by the clean postal code directly
    const cepCoords = await geocodePostalCode(cleanCep);
    if (cepCoords) {
      lat = cepCoords.lat;
      lng = cepCoords.lng;
      source = 'google';
    } else {
      // 4b. Try geocoding full street address
      const fullAddressQuery = [street, neighborhood, city, state, 'Brasil'].filter(Boolean).join(', ');
      const addressCoords = await geocodeTextAddress(fullAddressQuery);
      if (addressCoords) {
        lat = addressCoords.lat;
        lng = addressCoords.lng;
        source = 'google';
      } else if (neighborhood) {
        // 4c. Try geocoding neighborhood and city
        const neighCoords = await geocodeTextAddress(`${neighborhood}, ${city} - ${state}, Brasil`);
        if (neighCoords) {
          lat = neighCoords.lat;
          lng = neighCoords.lng;
          source = 'nominatim';
        }
      }
    }
  }

  // 5. Final fallback to city centroid if geocoding was completely unavailable
  if (!lat || !lng) {
    const normalizedCity = city.toLowerCase().trim();
    if (CITY_CENTROIDS[normalizedCity]) {
      lat = CITY_CENTROIDS[normalizedCity].lat;
      lng = CITY_CENTROIDS[normalizedCity].lng;
      source = 'city_centroid';
    } else {
      lat = -23.55052;
      lng = -46.633308;
      source = 'city_centroid';
    }
  }

  return {
    cep: `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`,
    street,
    neighborhood,
    city,
    state,
    lat,
    lng,
    formattedAddress: [street, neighborhood, `${city} - ${state}`].filter(Boolean).join(', '),
    source
  };
}
