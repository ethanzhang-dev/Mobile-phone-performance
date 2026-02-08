let socket, myRole = -1, isStarted = false;
let oscillators = []; 
let envelopes = [];
let drone;
let bgAlpha = 0;
let activeColor;
let socketStatus = "连接中...";

const instruments = [
    { name: "低音提琴", wave: 'sawtooth', base: 65, color: [255, 50, 50] },   // 红
    { name: "小提琴", wave: 'sawtooth', base: 261, color: [50, 255, 50] },   // 绿
    { name: "长笛", wave: 'triangle', base: 523, color: [50, 50, 255] },    // 蓝
    { name: "小号", wave: 'square', base: 392, color: [255, 255, 50] }      // 黄
];

function setup() {
    createCanvas(windowWidth, windowHeight);
    activeColor = color(0);

    socket = io();
    socket.on('connect', () => { socketStatus = "服务器已连接"; });
    socket.on('assignRole', (role) => { 
        myRole = role; 
        socketStatus = "角色分配成功: " + instruments[myRole].name;
    });

    // 监听广播：不管是自己的还是别人的动作，都触发光芒和声音
    socket.on('broadcastAction', (data) => {
        if (isStarted) {
            triggerPerformance(data.role, data.tilt);
        }
    });
}

function draw() {
    // 渲染背景闪烁
    background(red(activeColor) * bgAlpha, green(activeColor) * bgAlpha, blue(activeColor) * bgAlpha);
    if (bgAlpha > 0) bgAlpha -= 0.03; 

    if (!isStarted) {
        // 未开始时的界面
        fill(255);
        noStroke();
        ellipse(width/2, height/2, 120);
        fill(0);
        textAlign(CENTER, CENTER);
        text("START", width/2, height/2);
        
        // 显示状态辅助调试
        fill(255);
        textSize(14);
        text(socketStatus, width/2, height - 50);
    } else {
        // 演奏中界面
        fill(255, 150);
        textAlign(CENTER);
        textSize(20);
        text(instruments[myRole].name, width/2, height/2);
        textSize(14);
        text("摇晃手机或点击屏幕进行演奏", width/2, height/2 + 40);
    }
}

// 核心：点击按钮后才创建所有音频节点
async function initAudio() {
    if (getAudioContext().state !== 'running') {
        await getAudioContext().resume();
    }

    // 为 4 个乐器初始化音频
    for (let i = 0; i < 4; i++) {
        let env = new p5.Envelope();
        env.setADSR(0.05, 0.1, 0.4, 0.8);
        envelopes.push(env);

        let osc = new p5.Oscillator(instruments[i].wave);
        osc.amp(env);
        osc.start();
        oscillators.push(osc);
    }

    // 底层衬音
    drone = new p5.Oscillator('sine');
    drone.freq(65);
    drone.amp(0.04);
    drone.start();

    isStarted = true;
}

async function mousePressed() {
    if (!isStarted) {
        // 检查是否点击了 START 按钮
        if (dist(mouseX, mouseY, width/2, height/2) < 60) {
            // iOS 权限请求
            if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
                try {
                    await DeviceOrientationEvent.requestPermission();
                } catch (e) { console.error(e); }
            }
            await initAudio();
        }
    } else {
        // 演奏中点击屏幕也可以发声（作为摇晃的备份）
        sendShakeData();
    }
}

function sendShakeData() {
    if (socket && myRole !== -1) {
        socket.emit('shakeTrigger', { role: myRole, tilt: rotationX });
    }
}

function deviceShaken() {
    if (isStarted) {
        sendShakeData();
    }
}

// 统一的发声与视觉闪烁函数
function triggerPerformance(role, tilt) {
    if (envelopes[role] && oscillators[role]) {
        let freqMap = [1, 1.125, 1.25, 1.5, 1.66]; // 五声音阶
        let noteIdx = floor(map(constrain(tilt, -45, 45), -45, 45, 0, 5));
        let baseFreq = instruments[role].base;
        
        oscillators[role].freq(baseFreq * freqMap[noteIdx], 0.05);
        envelopes[role].play();

        // 设置光芒颜色
        let c = instruments[role].color;
        activeColor = color(c[0], c[1], c[2]);
        bgAlpha = 0.5; // 设置亮度
    }
}