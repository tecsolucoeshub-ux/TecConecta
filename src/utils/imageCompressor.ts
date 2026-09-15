/**
 * Image compression and helper utilities for TecConecta
 * Resizes user-uploaded photos on the client side using HTML5 Canvas
 * ensuring snappy load times, mobile compatibility, and minimal storage footprints.
 */

export function compressImageFile(file: File, maxDimension = 720, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check MIME type or common image extensions (for mobile browsers where file.type might be empty or image/heic)
    const isImageMime = file.type && file.type.startsWith('image/');
    const isImageExt = file.name && /\.(jpe?g|png|webp|gif|bmp|heic|heif|svg)$/i.test(file.name);

    if (!isImageMime && !isImageExt) {
      return reject(new Error('O arquivo selecionado não é uma imagem válida. Escolha JPG, PNG ou WebP.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem no aparelho.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Falha ao processar a imagem. Tente outro formato ou arquivo menor.'));
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(reader.result as string);
        }

        // Draw and compress to JPEG for guaranteed cross-device compatibility
        ctx.drawImage(img, 0, 0, width, height);
        try {
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        } catch {
          resolve(reader.result as string);
        }
      };
      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Category default high-quality background/showcase images from Unsplash
 */
export const CATEGORY_DEFAULT_PHOTOS: Record<string, string> = {
  'Soluções com IA': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
  'Tecnologia & TI': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
  'Eletricista': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
  'Diarista & Limpeza': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80',
  'Pintor & Acabamentos': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80',
  'Encanador & Hidráulica': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80',
  'Marido de Aluguel': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
  'Mecânico & Auto': 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
  'Beleza & Estética': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
  'Ar-Condicionado & Climatização': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&auto=format&fit=crop&q=80',
  'default': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80'
};

/**
 * Generates an ultra-lightweight SVG Data URI banner matching TecSoluções brand identity.
 * Guarantees that mobile devices NEVER show a broken image, blank void, or error icon,
 * even when offline, with slow mobile data, or if third-party image hosts block requests.
 */
export function generateFallbackBrandImage(name: string, category?: string): string {
  const safeName = (name || 'Anunciante TecConecta').replace(/[<>&"]/g, '');
  const safeCat = (category || 'Serviços Especializados').replace(/[<>&"]/g, '');
  const initial = safeName.charAt(0).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 340" width="100%" height="100%">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0B132B"/>
        <stop offset="50%" stop-color="#111F45"/>
        <stop offset="100%" stop-color="#080E21"/>
      </linearGradient>
      <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#00E5FF" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#FF6B00" stop-opacity="0.8"/>
      </linearGradient>
      <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(0, 229, 255, 0.07)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="600" height="340" fill="url(#bgGrad)"/>
    <rect width="600" height="340" fill="url(#grid)"/>
    <circle cx="520" cy="60" r="140" fill="#00E5FF" opacity="0.08" filter="blur(30px)"/>
    <circle cx="80" cy="280" r="120" fill="#FF6B00" opacity="0.08" filter="blur(30px)"/>
    
    <!-- Central Modern Emblem -->
    <circle cx="300" cy="115" r="48" fill="#0E1738" stroke="url(#glowGrad)" stroke-width="3"/>
    <text x="300" y="132" font-family="'Outfit', system-ui, sans-serif" font-size="44" font-weight="900" fill="#00E5FF" text-anchor="middle">${initial}</text>
    
    <!-- Business Name & Category -->
    <text x="300" y="205" font-family="'Outfit', system-ui, sans-serif" font-size="22" font-weight="bold" fill="#F4F7F6" text-anchor="middle">${safeName.length > 28 ? safeName.substring(0, 26) + '...' : safeName}</text>
    <rect x="200" y="225" width="200" height="28" rx="14" fill="rgba(0, 229, 255, 0.15)" stroke="rgba(0, 229, 255, 0.4)" stroke-width="1"/>
    <text x="300" y="244" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#00E5FF" text-anchor="middle">${safeCat}</text>
    
    <!-- Bottom Brand Signature -->
    <text x="300" y="305" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="rgba(244, 247, 246, 0.5)" text-anchor="middle">TecConecta • DaMaceno Soluções</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getProviderPhoto(imageUrl?: string, category?: string, name?: string): string {
  if (imageUrl && imageUrl.trim()) {
    return imageUrl.trim();
  }
  if (category && CATEGORY_DEFAULT_PHOTOS[category]) {
    return CATEGORY_DEFAULT_PHOTOS[category];
  }
  if (name) {
    return generateFallbackBrandImage(name, category);
  }
  return CATEGORY_DEFAULT_PHOTOS['default'];
}

