import type { FastifyInstance } from 'fastify'
import { usersTable } from '../../../../schema/index.ts'
import { db } from '../../../../services/db.ts'
import type { CreateUserBody } from '../../types/user.ts'

export async function usersPostRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateUserBody }>('/users', async (request, reply) => {
    const [user] = await db.insert(usersTable).values(request.body).returning()
    return reply.code(201).send({ user })
  })
}
