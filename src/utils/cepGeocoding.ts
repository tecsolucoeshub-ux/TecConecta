export interface CepLocationResult {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  formattedAddress: string;
  source: 'brasilapi' | 'google' | 'nominatim' | 'city_centroid';
}

// Fallback centroids for major Brazilian capitals/cities
const CITY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
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
 * Geocode an address using the Google Maps JavaScript API Geocoder if loaded,
 * or fallback to OpenStreetMap Nominatim.
 */
export async function geocodeTextAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  // 1. Try Google Maps Geocoder if API is initialized
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
 * Fetch Brazilian CEP and automatically detect full address & geocoordinates.
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

  // 1. Try BrasilAPI v2 (includes direct high-accuracy coordinates when available)
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
    if (res.ok) {
      const data = await res.json();
      street = data.street || '';
      neighborhood = data.neighborhood || '';
      city = data.city || '';
      state = data.state || '';

      if (data.location?.coordinates?.latitude && data.location?.coordinates?.longitude) {
        lat = Number(data.location.coordinates.latitude);
        lng = Number(data.location.coordinates.longitude);
        return {
          cep: `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`,
          street,
          neighborhood,
          city,
          state,
          lat,
          lng,
          formattedAddress: [street, neighborhood, `${city} - ${state}`].filter(Boolean).join(', '),
          source: 'brasilapi'
        };
      }
    }
  } catch (err) {
    console.warn('BrasilAPI request failed, trying ViaCEP fallback:', err);
  }

  // 2. If BrasilAPI didn't have coordinates or failed, try ViaCEP
  if (!city) {
    try {
      const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (viaCepRes.ok) {
        const data = await viaCepRes.json();
        if (!data.erro) {
          street = data.logradouro || '';
          neighborhood = data.bairro || '';
          city = data.localidade || '';
          state = data.uf || '';
        }
      }
    } catch (err) {
      console.warn('ViaCEP request failed:', err);
    }
  }

  if (!city) {
    throw new Error('CEP não encontrado. Por favor, confira os números digitados.');
  }

  // 3. Geocode the resolved address
  const fullAddressQuery = [street, neighborhood, city, state, 'Brasil'].filter(Boolean).join(', ');
  const coords = await geocodeTextAddress(fullAddressQuery);

  if (coords) {
    lat = coords.lat;
    lng = coords.lng;
    source = 'google';
  } else {
    // 4. City centroid fallback if street wasn't geocoded
    const normalizedCity = city.toLowerCase().trim();
    if (CITY_CENTROIDS[normalizedCity]) {
      lat = CITY_CENTROIDS[normalizedCity].lat;
      lng = CITY_CENTROIDS[normalizedCity].lng;
      source = 'city_centroid';
    } else {
      // General São Paulo / Brazil center default
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
