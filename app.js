const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

let playerCount = 0;

io.on('connection', (socket) => {
    // 分配角色 (0=低音, 1=中音, 2=高音, 3=清脆高音)
    let myRole = playerCount % 4;
    playerCount++;
    
    console.log(`✅ 玩家加入！分配音区: ${myRole}`);
    socket.emit('assignRole', myRole);

    socket.on('disconnect', () => {
        if(playerCount > 0) playerCount--;
    });
});

http.listen(3000, () => {
    console.log('🚀 音乐服务器已在 3000 端口启动...');
});