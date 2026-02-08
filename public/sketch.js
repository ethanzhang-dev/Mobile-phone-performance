let socket, myRole = -1, isStarted = false;
let oscillators = []; 
let lfos = []; // 用于产生“扭曲”感的低频振荡器
let isGlitching = [false, false, false, false];
let statusText = "Syncing Orchestra...";

// 旋律序列：C Major Pentatonic
const sequence = [261, 293, 329, 392, 440, 392, 329, 293]; 
const baseFreqs = [65, 261, 523, 392]; // Bass, Violin, Flute, Trumpet

function setup() {
    createCanvas(windowWidth, windowHeight);
    socket = io();
    socket.on('assignRole', (role) => { 
        myRole = role; 
        statusText = "Ready: " + ["BASS", "VIOLIN", "FLUTE", "TRUMPET"][myRole];
    });

    socket.on('broadcastAction', (data) => {
        if (isStarted) triggerGlitch(data.role, data.intensity);
    });
}

function draw() {
    if (!isStarted) {
        background(0);
        drawStartUI();
        return;
    }

    // 视觉反馈：如果没有破坏，就是黑色；如果有破坏，根据角色闪烁故障条纹
    background(0);
    drawGlitchVisuals();

    // 核心音序器逻辑：根据时间循环播放旋律
    let step = floor(frameCount / 15) % sequence.length;
    let currentNote = sequence[step];

    for (let i = 0; i < 4; i++) {
        if (oscillators[i]) {
            let f = currentNote * (baseFreqs[i] / 261);
            
            // 如果该声部正在被破坏
            if (isGlitching[i]) {
                applyGlitchEffect(i, f);
            } else {
                oscillators[i].freq(f, 0.1);
                oscillators[i].amp(0.15, 0.1); // 纯净音量
            }
        }
    }
}

function applyGlitchEffect(role, originalFreq) {
    let osc = oscillators[role];
    switch(role) {
        case 0: // Bass - Distortion/Growl
            osc.freq(originalFreq + random(-20, 20));
            osc.amp(random(0.3, 0.6)); // 变得巨大且不稳定
            break;
        case 1: // Violin - Stutter/Repetition
            let s = frameCount % 4 === 0 ? 0.4 : 0;
            osc.amp(s); 
            break;
        case 2: // Flute - Bitcrush/Digital Noise
            osc.freq(originalFreq * random(1, 5));
            osc.amp(0.2);
            break;
        case 3: // Trumpet - Pitch Freakout
            osc.freq(originalFreq + sin(frameCount) * 500);
            osc.amp(0.3);
            break;
    }
}

function triggerGlitch(role, intensity) {
    isGlitching[role] = true;
    // 1秒后自动恢复秩序（除非有人一直在摇）
    setTimeout(() => { isGlitching[role] = false; }, 800);
}

function drawGlitchVisuals() {
    for (let i = 0; i < 4; i++) {
        if (isGlitching[i]) {
            stroke(255, 150);
            strokeWeight(random(1, 20));
            line(0, random(height), width, random(height)); // 电视故障横纹
            if (i === myRole) {
                fill(255, 50);
                rect(0, 0, width, height); // 自己破坏时屏幕剧烈闪烁
            }
        }
    }
}

async function initAudio() {
    userStartAudio();
    for (let i = 0; i < 4; i++) {
        let wave = i === 2 ? 'triangle' : (i === 3 ? 'square' : 'sawtooth');
        let osc = new p5.Oscillator(wave);
        osc.start();
        osc.amp(0);
        oscillators.push(osc);
    }
    isStarted = true;
}

// UI & Interaction
function drawStartUI() {
    fill(255); ellipse(width/2, height/2, 140);
    fill(0); textAlign(CENTER, CENTER); textStyle(BOLD); text("START", width/2, height/2);
    fill(255); textStyle(NORMAL); text(statusText, width/2, height - 60);
}

async function mousePressed() {
    if (!isStarted && dist(mouseX, mouseY, width/2, height/2) < 70) {
        if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
            await DeviceOrientationEvent.requestPermission();
        }
        await initAudio();
    }
}

function deviceShaken() {
    if (isStarted) {
        socket.emit('shakeTrigger', { role: myRole, intensity: Math.abs(accelerationX) });
    }
}