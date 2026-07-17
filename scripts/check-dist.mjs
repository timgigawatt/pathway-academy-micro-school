/**
 * Post-build sanity check: fail the deploy if key pages are missing or empty.
 * Catches "the CMS silently returned nothing" before it ships.
 */
import { readFile } from 'node:fs/promises'

const checks = [
  { file: 'dist/index.html', marker: 'Pathway' },
  { file: 'dist/blog/index.html', marker: 'Blog' },
  { file: 'dist/contact/index.html', marker: 'form' },
]

let failed = false
for (const { file, marker } of checks) {
  try {
    const html = await readFile(file, 'utf8')
    if (!html.toLowerCase().includes(marker.toLowerCase())) {
      console.error(`✗ ${file} exists but is missing expected content ("${marker}")`)
      failed = true
    } else {
      console.log(`✓ ${file}`)
    }
  } catch {
    console.error(`✗ ${file} was not generated`)
    failed = true
  }
}

if (failed) process.exit(1)
console.log('dist check passed')
