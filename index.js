const express = require('express')
const socketio = require('socket.io')
const http = require('http')
const cors = require('cors');

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users.js')

const PORT = process.env.PORT || 5000;

const router = require('./router')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(router);
app.use(cors())

io.on('connection', (socket) => {
    socket.on('join', ({ name, room, publicKey }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room, publicKey })
        if (error) {
            return callback(error)
        }

        socket.emit('message', { user: 'admin', text: `${user.name}, Welcome to the room ${user.room}` })
        const users = getUsersInRoom(user.room)
        const keys = users.map(user => user.publicKey)
        socket.emit('GET_PUBLIC_KEYS', { keys })
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name}, has joined.` })
        socket.broadcast.to(user.room).emit('NEW_CONNECTION', { pubKey: publicKey })
        socket.join(user.room)

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', { user: user.name, text: message.message, publicKey: message.publicKey })
        }

    })

    socket.on('disconnect', () => {
        removeUser(socket.id)
    })
})

server.listen(PORT, () => console.log(`server has started on port ${PORT}`))