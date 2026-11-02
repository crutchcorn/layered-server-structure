import { serve } from '@hono/node-server'
import { Scalar } from '@scalar/hono-api-reference'
import { openAPIRouteHandler } from 'hono-openapi'
import { app } from './app.ts'
import { openAPIOptions } from './constants/open-api.ts'

app.get('/openapi', openAPIRouteHandler(app, openAPIOptions))

app.get(
  '/docs',
  Scalar({
    theme: 'saturn',
    url: '/openapi',
  }),
)

const PORT = 3030

serve({
  fetch: app.fetch,
  port: PORT,
})

console.log(`Server running at http://localhost:${PORT}`)
