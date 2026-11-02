import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { sendProblem } from '../../../../handlers/send-problem.ts'
import { usersTable } from '../../../../schema/index.ts'
import { db } from '../../../../services/db.ts'
import type { UserIdParams } from '../../types/user.ts'

export async function userByIdGetRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: UserIdParams }>(
    '/users/:id',
    async (request, reply) => {
      const id = Number(request.params.id)
      if (!Number.isInteger(id) || id < 1) {
        return sendProblem(reply, 400, 'Invalid user ID')
      }

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, id))
      if (!user) {
        return sendProblem(reply, 404, 'User not found')
      }

      return reply.send({ user })
    },
  )
}
