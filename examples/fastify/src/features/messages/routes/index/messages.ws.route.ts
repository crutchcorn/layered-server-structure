import type { FastifyInstance } from 'fastify'

export async function messagesWsRoutes(fastify: FastifyInstance) {
  fastify.get('/messages', { websocket: true }, (socket) => {
    socket.on('message', () => {
      socket.send('hi from server')
    })
  })
}
