let socket, osc, env, myRole = 0, isStarted = false;
const notes = [261.63, 293.66, 329.63, 392.00, 440.00]; // C, D, E, G, A
const octaves = [0.5, 1, 2, 4]; // 每个人负责不同的八度

function setup() {
    createCanvas(windowWidth, windowHeight);
    socket = io();
    socket.on('assignRole', (role) => { myRole = role; });

    env = new p5.Envelope();
    env.setADSR(0.01, 0.1, 0.2, 0.5); // 像风铃一样的敲击感
    osc = new p5.Oscillator('sine');
    osc.amp(env);
    osc.start();
}

function draw() {
    background(0); // 纯黑背景
    if (!isStarted) {
        fill(255);
        circle(width/2, height/2, 120); // 圆形按钮
        fill(0);
        textAlign(CENTER, CENTER);
        text("START", width/2, height/2);
    } else {
        // 视觉反馈：根据倾斜角度画一个圆
        noFill();
        stroke(255, 150);
        let d = map(rotationX, -90, 90, 50, 200);
        circle(width/2, height/2, d);
        
        // 实时更新音高：倾斜手机改变音符
        let index = floor(map(constrain(rotationX, -45, 45), -45, 45, 0, 5));
        osc.freq(notes[index] * octaves[myRole], 0.1);
    }
}

function mousePressed() {
    if (!isStarted && dist(mouseX, mouseY, width/2, height/2) < 60) {
        isStarted = true;
        userStartAudio();
        if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
            DeviceOrientationEvent.requestPermission();
        }
    }
}

// 核心功能：用力摇晃手机产生声音
function deviceShaken() {
    if (isStarted) {
        env.play(); 
    }
}