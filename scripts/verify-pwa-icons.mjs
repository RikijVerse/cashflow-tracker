import { readFileSync } from 'node:fs'
import { PNG } from 'pngjs'

// Amber accent is #f59e0b (r:245 g:158 b:11). Accept amber-ish pixels.
function isAmber(r, g, b, a) {
  if (a < 128) return false
  return r > 180 && g > 110 && g < 210 && b < 90 && r > g && g > b
}

function bbox(file) {
  const png = PNG.sync.read(readFileSync(file))
  const { width, height, data } = png
  let minX = width, minY = height, maxX = -1, maxY = -1, count = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (width * y + x) << 2
      if (isAmber(data[i], data[i + 1], data[i + 2], data[i + 3])) {
        count++
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (count === 0) return null
  return {
    width,
    height,
    glyphW: maxX - minX + 1,
    glyphH: maxY - minY + 1,
    cx: ((minX + maxX) / 2 / width * 100).toFixed(1),
    cy: ((minY + maxY) / 2 / height * 100).toFixed(1),
    wPct: (((maxX - minX + 1) / width) * 100).toFixed(1),
    hPct: (((maxY - minY + 1) / height) * 100).toFixed(1),
  }
}

for (const f of ['public/pwa-maskable-192.png', 'public/pwa-maskable-512.png']) {
  const b = bbox(f)
  if (!b) {
    console.log(`${f}: NO AMBER PIXELS FOUND (BROKEN)`)
    continue
  }
  const withinSafe =
    Number(b.cx) > 35 && Number(b.cx) < 65 && Number(b.cy) > 35 && Number(b.cy) < 65
  const sizeOk = Number(b.wPct) > 40 && Number(b.wPct) < 80
  console.log(
    `${f}: center=(${b.cx}%,${b.cy}%) size=${b.wPct}%x${b.hPct}% ` +
      `${withinSafe && sizeOk ? 'OK (centered & full)' : 'CHECK'}`,
  )
}
