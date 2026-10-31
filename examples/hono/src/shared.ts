import { Hono } from 'hono'
import { usersGetApp } from './features/users/users.get.ts'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('*', cors())

app.route('/users', usersGetApp)

export { app }