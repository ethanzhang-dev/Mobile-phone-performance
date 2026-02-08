let socket, osc, env, reverb;
let myRole = 0;
let isStarted = false;
let lastShakeTime = 0;

// 五声音阶（C, D, E, G, A）- 这种音阶怎么弹都好听
const baseNotes = [261.63, 293.66, 329.63, 392.00, 440.00];
const octaves = [0.5, 1, 2, 4]; // 角色分配：从低音到清脆高音

function setup() {
    createCanvas(windowWidth, windowHeight);
    socket = io();
    socket.on('assignRole', (role) => { myRole = role; });

    // 初始化声音
    env = new p5.Envelope();
    env.setADSR(0.01, 0.1, 0.2, 0.8); // 快速开启，缓慢消失
    
    osc = new p5.Oscillator('sine');
    osc.amp(env);
    
    reverb = new p5.Reverb();
    reverb.process(osc, 3, 2); // 增加3秒混响，让声音更空灵
}

function draw() {
    background(0); // 纯黑背景

    if (!isStarted) {
        drawStartButton();
    } else {
        // 演奏界面
        drawPerformanceUI();
        
        // 核心逻辑：倾斜手机改变当前预设音高
        let index = floor(map(constrain(rotationX, -45, 45), -45, 45, 0, 5));
        let targetFreq = baseNotes[index] * octaves[myRole];
        osc.freq(targetFreq, 0.1);
    }
}

function drawStartButton() {
    fill(255);
    noStroke();
    ellipse(width/2, height/2, 120);
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(20);
    text("START", width/2, height/2);
}

function drawPerformanceUI() {
    // 视觉反馈：根据倾斜角度画一个会跳动的圆圈
    noFill();
    stroke(255, 100);
    strokeWeight(2);
    let size = map(rotationX, -90, 90, 100, width * 0.8);
    ellipse(width/2, height/2, size);
    
    fill(255, 150);
    noStroke();
    textSize(14);
    text("角色: " + (myRole + 1) + " | 摇晃手机发声", width/2, height - 50);
}

// 核心点击函数：适配 iPhone 和安卓
async function mousePressed() {
    if (!isStarted && dist(mouseX, mouseY, width/2, height/2) < 60) {
        // 1. 激活音频
        userStartAudio();
        
        // 2. 申请传感器权限 (iOS)
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const response = await DeviceOrientationEvent.requestPermission();
                if (response === 'granted') {
                    startApp();
                } else {
                    alert("需要传感器权限才能参与合奏");
                }
            } catch (e) { console.error(e); }
        } else {
            // 安卓或普通浏览器
            startApp();
        }
    }
}

function startApp() {
    isStarted = true;
    osc.start();
    env.play(); // 开始时响一声提示
}

// 摇晃手机触发
function deviceShaken() {
    if (isStarted && millis() - lastShakeTime > 200) {
        env.play();
        lastShakeTime = millis();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}