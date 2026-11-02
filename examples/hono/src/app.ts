import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { usersRoute } from './features/users/users.route.ts'
import { requestTiming } from './middleware/request-timing.ts'

const app = new Hono()

app.use('*', cors())
app.use('*', requestTiming)

app.route('/users', usersRoute)

export { app }
