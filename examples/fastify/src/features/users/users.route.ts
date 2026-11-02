import type { FastifyInstance } from 'fastify'
import { userByIdGetRoutes } from './routes/by-id/user-by-id.get.route.ts'
import { usersGetRoutes } from './routes/index/users.get.route.ts'
import { usersPostRoutes } from './routes/index/users.post.route.ts'

export async function usersRoute(fastify: FastifyInstance) {
  await fastify.register(usersGetRoutes)
  await fastify.register(usersPostRoutes)
  await fastify.register(userByIdGetRoutes)
}
