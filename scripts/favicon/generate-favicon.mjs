// Génère les favicons à partir de frontend/public/logo.svg
// Sortie : favicon.ico (16/32/48), favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png
//
// Lancement (depuis la racine du repo, Docker requis) :
//   docker run --rm -v "$(pwd):/app" -w /app/scripts/favicon node:22-alpine \
//     sh -c "npm install && node generate-favicon.mjs"

import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(here, '../../frontend/public')
const src = resolve(publicDir, 'logo.svg')

const svg = await readFile(src)

// density élevée → rastérisation nette du SVG même en petites tailles
const render = (size, background = { r: 0, g: 0, b: 0, alpha: 0 }) =>
  sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain', background })
    .png()
    .toBuffer()

// PNG transparents pour le favicon
for (const size of [16, 32]) {
  await writeFile(resolve(publicDir, `favicon-${size}x${size}.png`), await render(size))
}

// apple-touch-icon : iOS ignore la transparence → fond crème de la charte (#f7f0de)
await writeFile(
  resolve(publicDir, 'apple-touch-icon.png'),
  await render(180, { r: 0xf7, g: 0xf0, b: 0xde, alpha: 1 })
)

// favicon.ico multi-tailles (16/32/48)
const ico = await pngToIco([await render(16), await render(32), await render(48)])
await writeFile(resolve(publicDir, 'favicon.ico'), ico)

console.log('✓ Favicons générés dans frontend/public/ : favicon.ico, favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png')
