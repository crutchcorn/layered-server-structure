import { describeRoute, resolver } from 'hono-openapi'
import {
  userResponseSchema,
  usersListResponseSchema,
} from '../../../utils/schema.ts'

export const usersGetDescribe = describeRoute({
  description: 'Returns all users',
  responses: {
    200: {
      description: 'List of users',
      content: {
        'application/json': { schema: resolver(usersListResponseSchema) },
      },
    },
  },
})

export const usersPostDescribe = describeRoute({
  description: 'Creates a user',
  responses: {
    201: {
      description: 'Created user',
      content: {
        'application/json': { schema: resolver(userResponseSchema) },
      },
    },
  },
})
