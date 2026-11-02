import { Hono } from 'hono'
import { userByIdGetRoute } from './routes/by-id/user-by-id.get.route.ts'
import { usersGetRoute } from './routes/index/users.get.route.ts'
import { usersPostRoute } from './routes/index/users.post.route.ts'

export const usersRoute = new Hono()
  .route('/', usersGetRoute)
  .route('/', usersPostRoute)
  .route('/', userByIdGetRoute)
