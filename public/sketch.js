let socket, myRole = 0, isStarted = false;
let oscillators = []; 
let envelopes = [];
let drone;
let bgAlpha = 0; // 用于背景闪烁
let activeColor;

// 乐器设定
const instruments = [
    { name: "低音提琴", wave: 'sawtooth', base: 65, color: [100, 50, 50] },   // 红色系
    { name: "小提琴", wave: 'sawtooth', base: 261, color: [50, 100, 50] },   // 绿色系
    { name: "长笛", wave: 'triangle', base: 523, color: [50, 50, 100] },    // 蓝色系
    { name: "小号", wave: 'square', base: 392, color: [100, 100, 50] }      // 黄色系
];

function setup() {
    createCanvas(windowWidth, windowHeight);
    socket = io();
    socket.on('assignRole', (role) => { myRole = role; });

    // 监听全场广播
    socket.on('broadcastAction', (data) => {
        if (!isStarted) return;
        playInstrument(data.role, data.tilt);
    });

    // 准备 4 种声音通道，这样你能听到别人的
    for (let i = 0; i < 4; i++) {
        let env = new p5.Envelope();
        env.setADSR(0.05, 0.1, 0.5, 1.0);
        envelopes.push(env);

        let osc = new p5.Oscillator(instruments[i].wave);
        osc.amp(env);
        oscillators.push(osc);
    }

    // 底层衬音
    drone = new p5.Oscillator('sine');
    drone.amp(0.03); 
    drone.freq(65); // 低音 C
    
    activeColor = color(0);
}

function draw() {
    // 背景色：基础是黑色，有人摇动时会闪烁乐器对应的颜色
    background(red(activeColor) * bgAlpha, green(activeColor) * bgAlpha, blue(activeColor) * bgAlpha);
    if (bgAlpha > 0) bgAlpha -= 0.05; // 闪烁后逐渐变黑

    if (!isStarted) {
        drawStartButton();
    } else {
        fill(255, 100);
        textAlign(CENTER);
        noStroke();
        text("你是: " + instruments[myRole].name, width/2, height - 100);
        text("用力摇晃手机！", width/2, height - 80);
    }
}

function drawStartButton() {
    fill(255);
    ellipse(width/2, height/2, 120);
    fill(0);
    textAlign(CENTER, CENTER);
    text("JOIN ORCHESTRA", width/2, height/2);
}

async function mousePressed() {
    if (!isStarted && dist(mouseX, mouseY, width/2, height/2) < 60) {
        // 解锁音频上下文 (安卓的关键)
        userStartAudio();
        
        // 尝试申请 iPhone 权限
        if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
            try {
                await DeviceOrientationEvent.requestPermission();
            } catch (e) { console.error(e); }
        }

        // 启动所有振荡器（初始音量为 0）
        oscillators.forEach(o => o.start());
        drone.start();
        
        isStarted = true;
    }
}

// 当任何人摇动时，执行发声逻辑
function playInstrument(role, tilt) {
    let freqMap = [1, 1.125, 1.25, 1.5, 1.66]; // 五声音阶倍率
    let noteIdx = floor(map(constrain(tilt, -45, 45), -45, 45, 0, 5));
    
    let baseFreq = instruments[role].base;
    oscillators[role].freq(baseFreq * freqMap[noteIdx], 0.1);
    envelopes[role].play();

    // 视觉反馈：设置闪烁颜色
    let c = instruments[role].color;
    activeColor = color(c[0], c[1], c[2]);
    bgAlpha = 0.8; 
}

// 摇晃触发
function deviceShaken() {
    if (isStarted) {
        socket.emit('shakeTrigger', { role: myRole, tilt: rotationX });
    }
}