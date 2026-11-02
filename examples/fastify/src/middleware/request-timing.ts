import type { FastifyInstance } from 'fastify'

export function registerRequestTiming(fastify: FastifyInstance) {
  const startTimes = new WeakMap<object, number>()

  fastify.addHook('onRequest', async (request) => {
    startTimes.set(request, performance.now())
  })

  fastify.addHook('onSend', async (request, reply, payload) => {
    const start = startTimes.get(request)
    if (start !== undefined) {
      const durationMs = (performance.now() - start).toFixed(2)
      reply.header('X-Response-Time', `${durationMs}ms`)
    }
    return payload
  })
}
