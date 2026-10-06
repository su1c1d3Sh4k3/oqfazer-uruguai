export const cropImageTo4by3 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject('Failed to get canvas context')

        const targetRatio = 4 / 3
        let sWidth = img.width
        let sHeight = img.height

        if (sWidth / sHeight > targetRatio) {
          sWidth = sHeight * targetRatio
        } else {
          sHeight = sWidth / targetRatio
        }

        const sX = (img.width - sWidth) / 2
        const sY = (img.height - sHeight) / 2

        // Resize to a standard maximum to save storage space
        canvas.width = 800
        canvas.height = 600

        ctx.drawImage(img, sX, sY, sWidth, sHeight, 0, 0, 800, 600)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = () => reject('Failed to load image')
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject('Failed to read file')
    reader.readAsDataURL(file)
  })
}

export const cropImageToSquare = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject('Failed to get canvas context')

        const size = Math.min(img.width, img.height)
        const sX = (img.width - size) / 2
        const sY = (img.height - size) / 2

        // Resize to a standard maximum to save storage space
        canvas.width = 400
        canvas.height = 400

        ctx.drawImage(img, sX, sY, size, size, 0, 0, 400, 400)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = () => reject('Failed to load image')
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject('Failed to read file')
    reader.readAsDataURL(file)
  })
}

/** Miniatura 480x360 em WebP para os cards (a imagem já vem recortada em 4:3). */
export const makeThumbnail = (dataUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject('Failed to get canvas context')
      canvas.width = 480
      canvas.height = 360
      ctx.drawImage(img, 0, 0, 480, 360)
      resolve(canvas.toDataURL('image/webp', 0.7))
    }
    img.onerror = () => reject('Failed to load image')
    img.src = dataUrl
  })
}
