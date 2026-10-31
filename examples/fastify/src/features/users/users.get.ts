import {db} from "../../services/db.ts";
import { usersTable } from '../../schema/index.ts';
import type { FastifyInstance } from "fastify";

export async function userGetRoutes(fastify: FastifyInstance) {
  fastify.get('/users', async (_request, reply) => {
    const users = await db.select().from(usersTable);
    reply.send({ users })
  })
}
