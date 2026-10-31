import Fastify from 'fastify'
import { userGetRoutes } from './features/users/users.get.ts'
import { messagesWSRoutes } from './features/messages/messages.ws.ts';

const fastify = Fastify({
  logger: true
})

userGetRoutes(fastify);
messagesWSRoutes(fastify);

// Run the server!
fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  console.log(`Server is now listening on ${address}`)
})