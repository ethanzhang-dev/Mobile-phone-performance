const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

let playerCount = 0;

io.on('connection', (socket) => {
    // 分配角色：0=深沉低音, 1=温暖中音, 2=明亮高音, 3=清脆超高音
    let myRole = playerCount % 4;
    playerCount++;
    
    console.log(`✅ 玩家加入！分配角色编号: ${myRole}`);
    socket.emit('assignRole', myRole);

    socket.on('disconnect', () => {
        console.log('❌ 玩家离开');
        if(playerCount > 0) playerCount--;
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`🚀 音乐服务器运行在: http://localhost:${PORT}`);
});