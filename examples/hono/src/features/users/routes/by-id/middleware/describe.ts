import { describeRoute, resolver } from 'hono-openapi'
import {
  problemResponseSchema,
  userResponseSchema,
} from '../../../utils/schema.ts'

export const userByIdGetDescribe = describeRoute({
  description: 'Returns a single user by ID',
  responses: {
    200: {
      description: 'Matching user',
      content: {
        'application/json': { schema: resolver(userResponseSchema) },
      },
    },
    404: {
      description: 'User not found',
      content: {
        'application/json': { schema: resolver(problemResponseSchema) },
      },
    },
  },
})
