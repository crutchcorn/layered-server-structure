import { createMiddleware } from 'hono/factory'

export const requestTiming = createMiddleware(async (c, next) => {
  const start = performance.now()
  await next()
  const durationMs = (performance.now() - start).toFixed(2)
  c.header('X-Response-Time', `${durationMs}ms`)
})
