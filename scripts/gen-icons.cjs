const sharp = require("sharp");
const path = require("path");

// Paraguas con fondo transparente
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">

  <!-- Cuerpo del paraguas (semicírculo) -->
  <path d="M 58 278 C 58 165 150 78 256 78 C 362 78 454 165 454 278 Z"
        fill="#29a8e0"/>

  <!-- Gota de agua (arriba derecha, fuera del paraguas) -->
  <path d="M 430 30 C 430 30 400 75 400 95 C 400 113 414 127 430 127 C 446 127 460 113 460 95 C 460 75 430 30 430 30 Z"
        fill="#29a8e0" stroke="white" stroke-width="6"/>

  <!-- Líneas decorativas internas -->
  <path d="M 256 78 L 256 278" stroke="white" stroke-width="7" stroke-opacity="0.35"/>
  <path d="M 155 92 C 132 155 130 220 132 278" stroke="white" stroke-width="6" stroke-opacity="0.25"/>
  <path d="M 357 92 C 380 155 382 220 380 278" stroke="white" stroke-width="6" stroke-opacity="0.25"/>

  <!-- Borde inferior ondulado -->
  <path d="M 58 278 Q 107 315 156 278 Q 206 241 256 278 Q 306 315 355 278 Q 405 241 454 278 L 454 288 Q 405 251 355 288 Q 306 325 256 288 Q 206 251 156 288 Q 107 325 58 288 Z"
        fill="#1e8dbf"/>

  <!-- Mango vertical -->
  <line x1="256" y1="278" x2="256" y2="418"
        stroke="#222233" stroke-width="22" stroke-linecap="round"/>

  <!-- Curva del mango -->
  <path d="M 256 418 Q 256 472 204 472 Q 168 472 168 438"
        fill="none" stroke="#222233" stroke-width="22" stroke-linecap="round"/>

</svg>`;

const buf = Buffer.from(svg);

async function generar() {
  const sizes = [192, 512];
  for (const size of sizes) {
    await sharp(buf)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, `../public/icon-${size}.png`));
    console.log(`✓ icon-${size}.png generado`);
  }
}

generar().catch(console.error);
