export interface CepLocationResult {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  formattedAddress: string;
  source: 'brasilapi' | 'awesomeapi' | 'nominatim' | 'photon' | 'city_centroid' | 'prefix';
}

/**
 * Normalizes city names for robust dictionary and geocoding matching
 * e.g. "Rio Verde - GO" -> "rio verde", "Montividiu-GO" -> "montividiu", "Caçu" -> "cacu"
 */
export function normalizeCityName(cityName: string): string {
  if (!cityName) return '';
  return cityName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s*-\s*[a-z]{2}$/i, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Known municipal CEP prefixes (especially useful for deactivated general municipal CEPs like 75900-000)
export const CEP_PREFIX_CITIES: Record<string, { city: string; state: string; lat: number; lng: number }> = {
  '75900': { city: 'Rio Verde', state: 'GO', lat: -17.7915, lng: -50.9201 },
  '75901': { city: 'Rio Verde', state: 'GO', lat: -17.7915, lng: -50.9201 },
  '75902': { city: 'Rio Verde', state: 'GO', lat: -17.7915, lng: -50.9201 },
  '75903': { city: 'Rio Verde', state: 'GO', lat: -17.7735, lng: -50.9292 },
  '75904': { city: 'Rio Verde', state: 'GO', lat: -17.7850, lng: -50.9350 },
  '75905': { city: 'Rio Verde', state: 'GO', lat: -17.7800, lng: -50.9250 },
  '75906': { city: 'Rio Verde', state: 'GO', lat: -17.7950, lng: -50.9150 },
  '75907': { city: 'Rio Verde', state: 'GO', lat: -17.8000, lng: -50.9400 },
  '75908': { city: 'Rio Verde', state: 'GO', lat: -17.8100, lng: -50.9300 },
  '75909': { city: 'Rio Verde', state: 'GO', lat: -17.8150, lng: -50.9200 },
  '75910': { city: 'Rio Verde', state: 'GO', lat: -17.7700, lng: -50.9100 },
  '75911': { city: 'Rio Verde', state: 'GO', lat: -17.7850, lng: -50.9050 },
  '75912': { city: 'Rio Verde', state: 'GO', lat: -17.7981, lng: -50.9281 },
  '75913': { city: 'Rio Verde', state: 'GO', lat: -17.8050, lng: -50.9350 },
  '75914': { city: 'Rio Verde', state: 'GO', lat: -17.8200, lng: -50.9400 },
  '75915': { city: 'Montividiu', state: 'GO', lat: -17.44417, lng: -51.17472 },
  '75813': { city: 'Caçu', state: 'GO', lat: -18.55667, lng: -51.13083 },
  '75800': { city: 'Jataí', state: 'GO', lat: -17.8856, lng: -51.7203 },
  '75920': { city: 'Santa Helena de Goiás', state: 'GO', lat: -17.8136, lng: -50.5969 },
  '75960': { city: 'Acreúna', state: 'GO', lat: -17.3975, lng: -50.3756 },
  '75860': { city: 'Quirinópolis', state: 'GO', lat: -18.4489, lng: -50.4517 },
  '75500': { city: 'Itumbiara', state: 'GO', lat: -18.4194, lng: -49.2178 },
  '75830': { city: 'Mineiros', state: 'GO', lat: -17.5706, lng: -52.5539 },
  '74000': { city: 'Goiânia', state: 'GO', lat: -16.6869, lng: -49.2648 },
  '74900': { city: 'Aparecida de Goiânia', state: 'GO', lat: -16.8228, lng: -49.2478 },
  '75000': { city: 'Anápolis', state: 'GO', lat: -16.3286, lng: -48.9534 },
  '70000': { city: 'Brasília', state: 'DF', lat: -15.7975, lng: -47.8919 },
  '01000': { city: 'São Paulo', state: 'SP', lat: -23.55052, lng: -46.633308 }
};

// Centroids for Brazilian municipalities (focus on Goiás & Southwest Goiás & state capitals)
export const CITY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  // Goiás - Sudoeste & Centro
  'rio verde': { lat: -17.7915, lng: -50.9201 },
  'montividiu': { lat: -17.44417, lng: -51.17472 },
  'cacu': { lat: -18.55667, lng: -51.13083 },
  'santa helena de goias': { lat: -17.8136, lng: -50.5969 },
  'jatai': { lat: -17.8856, lng: -51.7203 },
  'acreuna': { lat: -17.3975, lng: -50.3756 },
  'quirinopolis': { lat: -18.4489, lng: -50.4517 },
  'itumbiara': { lat: -18.4194, lng: -49.2178 },
  'mineiros': { lat: -17.5706, lng: -52.5539 },
  'goiania': { lat: -16.686891, lng: -49.264794 },
  'aparecida de goiania': { lat: -16.8228, lng: -49.2478 },
  'anapolis': { lat: -16.3286, lng: -48.9534 },
  'caldas novas': { lat: -17.7444, lng: -48.6256 },
  'senador canedo': { lat: -16.7083, lng: -49.0917 },
  'trindade': { lat: -16.6497, lng: -49.4889 },
  'formosa': { lat: -15.5392, lng: -47.3367 },
  'luziania': { lat: -16.2528, lng: -47.95 },
  'valparaiso de goias': { lat: -16.0689, lng: -47.9758 },
  'aguas lindas de goias': { lat: -15.7625, lng: -48.2814 },
  'catalao': { lat: -18.1658, lng: -47.9442 },

  // Distrito Federal & Capitais do Brasil
  'brasilia': { lat: -15.7975, lng: -47.8919 },
  'sao paulo': { lat: -23.55052, lng: -46.633308 },
  'rio de janeiro': { lat: -22.906847, lng: -43.172896 },
  'belo horizonte': { lat: -19.916681, lng: -43.934493 },
  'curitiba': { lat: -25.428954, lng: -49.267137 },
  'porto alegre': { lat: -30.034647, lng: -51.217659 },
  'salvador': { lat: -12.971599, lng: -38.501594 },
  'recife': { lat: -8.047562, lng: -34.876964 },
  'fortaleza': { lat: -3.731862, lng: -38.52667 },
  'manaus': { lat: -3.119028, lng: -60.021731 },
  'belem': { lat: -1.4558, lng: -48.5039 },
  'florianopolis': { lat: -27.595378, lng: -48.54805 },
  'vitoria': { lat: -20.3155, lng: -40.3128 },
  'cuiaba': { lat: -15.601, lng: -56.0974 },
  'campo grande': { lat: -20.4697, lng: -54.6201 },
  'palmas': { lat: -10.2491, lng: -48.3243 },
  'teresina': { lat: -5.0919, lng: -42.8034 },
  'sao luis': { lat: -2.5307, lng: -44.3068 },
  'natal': { lat: -5.7945, lng: -35.211 },
  'joao pessoa': { lat: -7.1195, lng: -34.845 },
  'maceio': { lat: -9.6658, lng: -35.735 },
  'aracaju': { lat: -10.9472, lng: -37.0731 },
  'porto velho': { lat: -8.7619, lng: -63.9039 },
  'rio branco': { lat: -9.9753, lng: -67.8249 },
  'macapa': { lat: 0.0349, lng: -51.0694 },
  'boa vista': { lat: 2.8235, lng: -60.6758 }
};

/**
 * Geocode text address using Photon (Komoot OSM) or OpenStreetMap Nominatim
 */
export async function geocodeTextAddress(addressQuery: string): Promise<{ lat: number; lng: number } | null> {
  const cleanQuery = addressQuery.trim();
  if (!cleanQuery) return null;

  // 1. Try Photon (extremely fast OpenStreetMap geocoder, no API key required)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery + ', Brasil')}&limit=1`;
    const resp = await fetch(photonUrl);
    if (resp.ok) {
      const data = await resp.json();
      const coords = data?.features?.[0]?.geometry?.coordinates;
      if (Array.isArray(coords) && coords.length >= 2) {
        const lng = Number(coords[0]);
        const lat = Number(coords[1]);
        if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
          return { lat, lng };
        }
      }
    }
  } catch (err) {
    console.warn('[TecConecta] Photon geocoding fallback:', err);
  }

  // 2. Try OpenStreetMap Nominatim
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery + ', Brasil')}&countrycodes=br&limit=1`;
    const resp = await fetch(nomUrl, {
      headers: { 'User-Agent': 'TecConecta-App/1.0 (tecsolucoeshub@gmail.com)' }
    });
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0 && data[0]?.lat && data[0]?.lon) {
        const lat = Number(data[0].lat);
        const lng = Number(data[0].lon);
        if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
          return { lat, lng };
        }
      }
    }
  } catch (err) {
    console.warn('[TecConecta] Nominatim geocoding fallback:', err);
  }

  return null;
}

/**
 * Fetch Brazilian CEP and automatically detect full address & precise geocoordinates faithful to the registered CEP.
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

  // 1. Try BrasilAPI v2 (primary source for postal coordinates in Brazil)
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
    if (res.ok) {
      const data = await res.json();
      if (data.street) street = data.street.trim();
      if (data.neighborhood) neighborhood = data.neighborhood.trim();
      if (data.city) city = data.city.trim();
      if (data.state) state = data.state.trim();

      const rawLat = data.location?.coordinates?.latitude;
      const rawLng = data.location?.coordinates?.longitude;
      if (rawLat && rawLng) {
        const parsedLat = Number(rawLat);
        const parsedLng = Number(rawLng);
        if (!isNaN(parsedLat) && !isNaN(parsedLng) && (parsedLat !== 0 || parsedLng !== 0)) {
          lat = parsedLat;
          lng = parsedLng;
          source = 'brasilapi';
        }
      }
    }
  } catch (err) {
    console.warn('[TecConecta] BrasilAPI v2 check:', err);
  }

  // 2. Try ViaCEP if address info is missing
  if (!city || !street) {
    try {
      const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (viaCepRes.ok) {
        const data = await viaCepRes.json();
        if (!data.erro) {
          if (!street && data.logradouro) street = data.logradouro.trim();
          if (!neighborhood && data.bairro) neighborhood = data.bairro.trim();
          if (!city && data.localidade) city = data.localidade.trim();
          if (!state && data.uf) state = data.uf.trim();
        }
      }
    } catch (err) {
      console.warn('[TecConecta] ViaCEP request failed:', err);
    }
  }

  // 3. Try AwesomeAPI if coordinates or address still missing
  if (!city || !lat || !lng) {
    try {
      const awesomeRes = await fetch(`https://cep.awesomeapi.com.br/json/${cleanCep}`);
      if (awesomeRes.ok) {
        const aData = await awesomeRes.json();
        if (!street && aData.address) street = aData.address.trim();
        if (!neighborhood && aData.district) neighborhood = aData.district.trim();
        if (!city && aData.city) city = aData.city.trim();
        if (!state && aData.state) state = aData.state.trim();

        if ((!lat || !lng) && aData.lat && aData.lng) {
          const parsedLat = Number(aData.lat);
          const parsedLng = Number(aData.lng);
          if (!isNaN(parsedLat) && !isNaN(parsedLng) && (parsedLat !== 0 || parsedLng !== 0)) {
            lat = parsedLat;
            lng = parsedLng;
            source = 'awesomeapi';
          }
        }
      }
    } catch (e) {
      console.warn('[TecConecta] AwesomeAPI CEP check:', e);
    }
  }

  // 4. Try prefix database if city is still missing
  if (!city) {
    const prefix5 = cleanCep.slice(0, 5);
    const prefixMatch = CEP_PREFIX_CITIES[prefix5];
    if (prefixMatch) {
      city = prefixMatch.city;
      state = prefixMatch.state;
      if (!lat || !lng) {
        lat = prefixMatch.lat;
        lng = prefixMatch.lng;
        source = 'prefix';
      }
    }
  }

  if (!city) {
    throw new Error('CEP não encontrado. Por favor, confira os números digitados.');
  }

  // 5. If coordinates are still missing, perform online geocoding with address queries
  if (!lat || !lng) {
    // 5a. If street and neighborhood are known, query exact street address
    if (street && city) {
      const streetQuery = [street, neighborhood, `${city} - ${state}`].filter(Boolean).join(', ');
      const coords = await geocodeTextAddress(streetQuery);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
        source = 'photon';
      }
    }

    // 5b. If still missing, query neighborhood + city
    if ((!lat || !lng) && neighborhood && city) {
      const neighQuery = `${neighborhood}, ${city}, ${state}`;
      const coords = await geocodeTextAddress(neighQuery);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
        source = 'photon';
      }
    }

    // 5c. If still missing, query city + state
    if (!lat || !lng) {
      const cityQuery = `${city}, ${state || 'Goiás'}, Brasil`;
      const coords = await geocodeTextAddress(cityQuery);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
        source = 'photon';
      }
    }
  }

  // 6. Centroid dictionary fallback (matches normalized city name)
  if (!lat || !lng) {
    const norm = normalizeCityName(city);
    if (CITY_CENTROIDS[norm]) {
      lat = CITY_CENTROIDS[norm].lat;
      lng = CITY_CENTROIDS[norm].lng;
      source = 'city_centroid';
    } else {
      // Default to TecSoluções headquarters in Rio Verde - GO if city not in database
      lat = -17.7915;
      lng = -50.9201;
      source = 'city_centroid';
    }
  }

  const formattedAddressParts = [street, neighborhood, state ? `${city} - ${state}` : city].filter(Boolean);

  return {
    cep: `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`,
    street,
    neighborhood,
    city: state ? `${city} - ${state}` : city,
    state,
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    formattedAddress: formattedAddressParts.length > 0 ? formattedAddressParts.join(', ') : 'Atendimento Local',
    source
  };
}
