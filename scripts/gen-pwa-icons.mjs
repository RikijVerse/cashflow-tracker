import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const pub = resolve(root, 'public')

const jobs = [
  { src: 'favicon.svg', out: 'pwa-192.png', size: 192 },
  { src: 'favicon.svg', out: 'pwa-512.png', size: 512 },
  { src: 'favicon.svg', out: 'apple-touch-icon.png', size: 180 },
  { src: 'pwa-maskable.svg', out: 'pwa-maskable-192.png', size: 192 },
  { src: 'pwa-maskable.svg', out: 'pwa-maskable-512.png', size: 512 },
]

for (const { src, out, size } of jobs) {
  const svg = readFileSync(resolve(pub, src), 'utf8')
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background: 'transparent',
  })
  const png = resvg.render().asPng()
  writeFileSync(resolve(pub, out), png)
  console.log(`generated public/${out} (${size}px)`)
}
