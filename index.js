const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');

const {addUser, removeUser, getUser, getUsersInRoom}= require ("./users");



const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);


app.use(router);
app.use(cors())

io.on("connection", (socket) => {
    console.log("We have a new connection");

    socket.on('join', ({name,room}, callback) => {
        // console.log(name,room);

        const {error,user} = addUser({id: socket.id, name , room});

        if(error) return callback(error);
        //emit will send message to the user who had joined
        socket.emit('message', {user: 'admin', text : `${user.name}, welcome to room ${user.room}.`});
        
        // broadcast will send message to everyone in the room except the joined user
        socket.broadcast.to(user.room)
        .emit('message', {user: "admin", text: `${user.name}, has joined`});
        
        socket.join(user.room);

        io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});
        // io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

        callback();
        
    })

    socket.on('sendMessage', (message,callback) => {
        // console.log(socket.id);
        const user = getUser(socket.id);
        // console.log("u",user);

        io.to(user.room).emit('message', {user: user.name, text: message});
        io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});

        callback();
    })

    socket.on('disconnect', () => {
        const user= removeUser(socket.id);
        if(user){
            io.to(user.room).emit('message', {user: 'admin', text: `${user.name} had left`});
        }
    })

})



server.listen(process.env.PORT || 5000, () => console.log(`Server has started.`));