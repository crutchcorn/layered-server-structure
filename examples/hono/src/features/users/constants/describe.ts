import { describeRoute, resolver } from 'hono-openapi'
import { responseSchema } from '../utils/schema.ts'

export const usersGetDescribe = describeRoute({
  description: "Returns a list of users",
  responses: {
    200: {
      description: 'Successful response',
      content: {
        'application/json': { schema: resolver(responseSchema) },
      },
    },
  },
})