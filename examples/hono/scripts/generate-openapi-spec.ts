import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { generateSpecs } from 'hono-openapi'
import { app } from '../src/app.ts'
import { openAPIOptions } from '../src/constants/open-api.ts'

const outPath = resolve(import.meta.dirname, '../out/openapi.json')

const specs = await generateSpecs(app, openAPIOptions)
await mkdir(dirname(outPath), { recursive: true })
await writeFile(outPath, JSON.stringify(specs, null, 2), 'utf-8')
