/**
 * Image compression and helper utilities for TecConecta
 * Resizes user-uploaded photos on the client side using HTML5 Canvas
 * ensuring snappy load times and minimal storage footprints.
 */

export function compressImageFile(file: File, maxDimension = 900, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('O arquivo selecionado não é uma imagem válida.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Falha ao processar a imagem.'));
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
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(reader.result as string);
        }

        // Draw and compress to JPEG
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
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

export function getProviderPhoto(imageUrl?: string, category?: string): string {
  if (imageUrl && imageUrl.trim()) {
    return imageUrl;
  }
  if (category && CATEGORY_DEFAULT_PHOTOS[category]) {
    return CATEGORY_DEFAULT_PHOTOS[category];
  }
  return CATEGORY_DEFAULT_PHOTOS['default'];
}
