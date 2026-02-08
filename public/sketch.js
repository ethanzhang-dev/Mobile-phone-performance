let socket, myRole = -1, isStarted = false;
let oscillators = []; 
let envelopes = [];
let bgAlpha = 0;
let statusText = "Syncing Creep...";

// Creep 经典和弦进行: G, B, C, Cm
const chordProgression = [
  [98, 123, 146], // G Major
  [123, 155, 185], // B Major
  [130, 164, 196], // C Major
  [130, 155, 196]  // C Minor
];

const roleNames = ["BASS", "GUITAR", "ARPEGGIO", "LEAD"];

function setup() {
  createCanvas(windowWidth, windowHeight);
  socket = io();
  socket.on('assignRole', (r) => { 
    myRole = r; 
    statusText = "Ready: " + roleNames[myRole];
  });
  socket.on('broadcastAction', (data) => {
    if (isStarted) triggerDeconstruction(data.role, data.intensity);
  });
}

function draw() {
  background(0);
  if (!isStarted) {
    drawStartUI();
    return;
  }

  // 计算当前和弦 (每2秒换一个和弦)
  let timeInBar = (millis() / 2000) % 4;
  let chordIdx = floor(timeInBar);
  let currentChord = chordProgression[chordIdx];

  // 视觉故障效果
  if (bgAlpha > 0) {
    drawGlitchVisuals();
    bgAlpha -= 0.05;
  }

  // 音频实时处理
  for (let i = 0; i < 4; i++) {
    if (oscillators[i]) {
      let baseFreq = currentChord[i % 3] * (i === 0 ? 0.5 : (i === 3 ? 2 : 1));
      
      // 核心改变：如果有人在摇晃，音量加倍并改变频率；否则只是轻微垫音
      if (bgAlpha > 0.1) {
        let glitchFreq = baseFreq * (1 + random(-0.5, 0.5));
        oscillators[i].freq(glitchFreq, 0.05);
        oscillators[i].amp(0.6, 0.1); // 破坏音量
      } else {
        oscillators[i].freq(baseFreq, 0.2);
        oscillators[i].amp(0.1, 0.5); // 基础垫音
      }
    }
  }
}

function triggerDeconstruction(role, intensity) {
  bgAlpha = 1.0; // 触发全场视觉闪烁
  // 这里可以针对 role 增加更复杂的音效映射
}

async function initAudio() {
  userStartAudio();
  for (let i = 0; i < 4; i++) {
    // 为不同角色设置不同波形以区分“乐器”
    let type = ['sawtooth', 'square', 'triangle', 'sawtooth'][i];
    let osc = new p5.Oscillator(type);
    osc.start();
    osc.amp(0);
    oscillators.push(osc);
  }
  isStarted = true;
}

function drawStartUI() {
  fill(255); ellipse(width/2, height/2, 140);
  fill(0); textAlign(CENTER, CENTER); textSize(20); text("CONDUCT", width/2, height/2);
  fill(255); text(statusText, width/2, height - 60);
}

function drawGlitchVisuals() {
  stroke(255, 200);
  for (let i = 0; i < 10; i++) {
    strokeWeight(random(1, 10));
    let y = random(height);
    line(0, y, width, y);
  }
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
    socket.emit('shakeTrigger', { role: myRole, intensity: accelerationX });
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }