const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

// 1. 创建全局状态对象 [cite: 148, 151]
let experienceState = {
    users: {}
};

io.on('connection', (socket) => {
    // 2. 为每个新连接分配 Socket ID [cite: 83, 94]
    console.log('✅ 玩家加入: ' + socket.id);
    
    // 初始化用户状态 [cite: 172]
    experienceState.users[socket.id] = { angle: 0 };

    // 3. 接收客户端发来的感应数据 [cite: 49]
    socket.on('gyroData', (data) => {
        if (experienceState.users[socket.id]) {
            experienceState.users[socket.id].angle = data.angle;
            // 4. 广播给所有人 [cite: 127, 176]
            io.emit('updateAll', experienceState.users);
        }
    });

    socket.on('disconnect', () => {
        delete experienceState.users[socket.id];
        io.emit('updateAll', experienceState.users);
    });
});

const PORT = 3000; 
http.listen(PORT, () => {
    console.log('------------------------------');
    console.log('🚀 服务器正在 3000 端口值班...');
    console.log('请不要关闭这个窗口！');
    console.log('------------------------------');
});