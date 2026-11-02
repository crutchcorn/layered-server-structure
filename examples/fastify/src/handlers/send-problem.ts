import type { FastifyReply } from 'fastify'

export function sendProblem(
  reply: FastifyReply,
  status: number,
  message: string,
) {
  return reply.code(status).send({ error: message })
}
