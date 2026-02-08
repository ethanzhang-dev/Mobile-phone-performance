const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

let playerCount = 0;
io.on('connection', (socket) => {
    let myRole = playerCount % 4; 
    playerCount++;
    socket.emit('assignRole', myRole);

    socket.on('shakeTrigger', (data) => {
        io.emit('broadcastAction', data); 
    });

    socket.on('disconnect', () => { if(playerCount > 0) playerCount--; });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on ${PORT}`));