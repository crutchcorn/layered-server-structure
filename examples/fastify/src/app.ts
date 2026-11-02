import Fastify from 'fastify'
import { messagesRoute } from './features/messages/messages.route.ts'
import { usersRoute } from './features/users/users.route.ts'
import { registerRequestTiming } from './middleware/request-timing.ts'

export function buildApp() {
  const fastify = Fastify({
    logger: true,
  })

  registerRequestTiming(fastify)
  fastify.register(usersRoute)
  fastify.register(messagesRoute)

  return fastify
}
