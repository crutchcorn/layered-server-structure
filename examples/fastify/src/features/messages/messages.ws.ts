import fastifyWebsocket from "@fastify/websocket"
import type { FastifyInstance } from "fastify"

export async function messagesWSRoutes(fastify: FastifyInstance) {
    fastify.register(fastifyWebsocket)
    fastify.register(fastify => {
        fastify.get('/messages', { websocket: true }, (socket, _req) => {
            socket.on('message', _message => {
                socket.send('hi from server')
            })
        })
    })
}