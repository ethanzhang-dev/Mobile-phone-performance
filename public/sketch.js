let socket;
let allUsers = {};
let myId;
let osc;
let isStarted = false;

// 性能优化：限制发送频率 [cite: 371, 372]
let lastSent = 0;
const SEND_RATE = 30; // 每 30 毫秒发一次

function setup() {
    createCanvas(windowWidth, windowHeight);
    socket = io(); // [cite: 34]

    // 获取自己的 ID [cite: 90, 100]
    socket.on("connect", () => {
        myId = socket.id;
    });

    // 接收全员状态更新 [cite: 178, 180]
    socket.on("updateAll", (data) => {
        allUsers = data;
    });

    // 创建交互按钮 [cite: 266]
    let btn = createButton('点击加入编舞');
    btn.position(width/2 - 60, height/2);
    btn.mousePressed(() => {
        isStarted = true;
        btn.hide();
        osc = new p5.Oscillator('sine');
        osc.start();
        osc.amp(0);
        // 解锁传感器权限 [cite: 391]
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission();
        }
    });
}

function draw() {
    background(25, 25, 40);
    if (!isStarted) return;

    // 1. 获取手机角度 [cite: 281]
    let myAngle = rotationBeta || 0; 

    // 2. 节流发送数据 [cite: 374, 375]
    let now = millis();
    if (now - lastSent > SEND_RATE) {
        socket.emit("gyroData", { angle: myAngle });
        lastSent = now;
    }

    // 3. 绘制所有玩家 [cite: 191]
    for (let id in allUsers) {
        let userAngle = allUsers[id].angle;
        let x = map(userAngle, -90, 90, 0, width);
        
        if (id === myId) {
            fill(0, 255, 150);
            stroke(255);
            // 声音随角度变化
            let freq = map(userAngle, -90, 90, 200, 600);
            osc.freq(freq, 0.1);
            osc.amp(0.3, 0.1);
        } else {
            fill(255, 100);
            noStroke();
        }
        ellipse(x, height/2, 50, 50);
    }
}