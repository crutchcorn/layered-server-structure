import fastifyWebsocket from '@fastify/websocket'
import type { FastifyInstance } from 'fastify'
import { messagesWsRoutes } from './routes/index/messages.ws.route.ts'

export async function messagesRoute(fastify: FastifyInstance) {
  await fastify.register(fastifyWebsocket)
  await fastify.register(messagesWsRoutes)
}
