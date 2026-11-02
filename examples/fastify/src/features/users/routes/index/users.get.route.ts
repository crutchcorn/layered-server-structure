import type { FastifyInstance } from 'fastify'
import { usersTable } from '../../../../schema/index.ts'
import { db } from '../../../../services/db.ts'

export async function usersGetRoutes(fastify: FastifyInstance) {
  fastify.get('/users', async (_request, reply) => {
    const users = await db.select().from(usersTable)
    return reply.send({ users })
  })
}
