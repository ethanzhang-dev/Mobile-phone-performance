let socket, myRole = 0, isStarted = false;
let myOsc, droneOsc;
let remoteOscs = []; // 存储其他人的乐器
let envs = [];       // 存储所有人的包络
const notes = [130.81, 164.81, 196.00, 220.00, 261.63]; // C大调和弦音
const waveforms = ['sawtooth', 'sawtooth', 'triangle', 'square']; // 模拟不同乐器

function setup() {
    createCanvas(windowWidth, windowHeight);
    socket = io();
    
    // 初始化 4 个角色的包络和振荡器，以便能听到别人的声音
    for (let i = 0; i < 4; i++) {
        let e = new p5.Envelope();
        e.setADSR(0.02, 0.2, 0.3, 1.5);
        envs.push(e);

        let o = new p5.Oscillator(waveforms[i]);
        o.amp(e);
        o.start();
        remoteOscs.push(o);
    }

    // 衬音：低沉的背景音
    droneOsc = new p5.Oscillator('sine');
    droneOsc.amp(0.05); // 极小声
    droneOsc.freq(65.41); // 低音 C

    socket.on('assignRole', (role) => { myRole = role; });

    // 听到别人摇动时的反应
    socket.on('broadcastShake', (data) => {
        if (!isStarted) return;
        let noteIdx = floor(map(data.tilt, -45, 45, 0, 5));
        let freq = notes[noteIdx] * (data.role == 0 ? 0.5 : data.role);
        remoteOscs[data.role].freq(freq, 0.1);
        envs[data.role].play();
    });
}

function draw() {
    background(0);
    if (!isStarted) {
        fill(255); circle(width/2, height/2, 120);
        fill(0); textAlign(CENTER, CENTER); text("CONDUCT", width/2, height/2);
    } else {
        // 戏谑的可视化：像指挥棒在动
        stroke(255, 50);
        line(width/2, height/2, width/2 + rotationY*5, height/2 + rotationX*5);
        fill(255, 20); noStroke();
        circle(width/2 + rotationY*5, height/2 + rotationX*5, 50);
    }
}

async function mousePressed() {
    if (!isStarted && dist(mouseX, mouseY, width/2, height/2) < 60) {
        userStartAudio();
        if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
            await DeviceOrientationEvent.requestPermission();
        }
        isStarted = true;
        droneOsc.start();
    }
}

function deviceShaken() {
    if (isStarted) {
        // 摇动时，把自己的数据传给服务器
        socket.emit('shakeTrigger', {
            role: myRole,
            tilt: rotationX
        });
    }
}