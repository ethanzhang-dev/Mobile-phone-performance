let socket, myRole = -1, isStarted = false;
let oscillators = []; 
let roleGlitches = [0, 0, 0, 0]; // 记录每个角色的破坏强度
let statusText = "Syncing Creep...";

// Creep Chords: G (G,B,D), B (B,D#,F#), C (C,E,G), Cm (C,Eb,G)
const creepChords = [
  [98, 123, 146],  // G
  [123, 155, 185], // B
  [130, 164, 196], // C
  [130, 155, 196]  // Cm
];

const roleNames = ["BASS", "GUITAR", "PIANO", "LEAD"];

function setup() {
  createCanvas(windowWidth, windowHeight);
  socket = io();
  socket.on('assignRole', (r) => { 
    myRole = r; 
    statusText = "Ready: " + roleNames[myRole];
  });
  socket.on('broadcastAction', (data) => {
    if (isStarted) {
      roleGlitches[data.role] = 1.0; // 触发该角色的破坏效果
    }
  });
}

function draw() {
  background(0);
  if (!isStarted) {
    drawStartUI();
    return;
  }

  // Creep 节奏器：每 2 秒换一个和弦，每 0.5 秒一个重音
  let totalTime = millis() / 2000;
  let chordIdx = floor(totalTime) % 4;
  let beatIdx = floor(millis() / 500) % 4;
  let currentChord = creepChords[chordIdx];

  // 渲染 4 个角色的声音和视觉
  for (let i = 0; i < 4; i++) {
    if (oscillators[i]) {
      let baseF = currentChord[i % 3] * (i === 0 ? 0.5 : (i === 3 ? 2 : 1));
      
      if (roleGlitches[i] > 0.1) {
        // --- 核心逻辑：不同的角色有不同的破坏效果 ---
        applyRoleGlitch(i, baseF);
        drawRoleVisuals(i);
        roleGlitches[i] -= 0.05; // 破坏效果逐渐消退
      } else {
        // 正常的 Creep 垫音逻辑
        let volume = (i === beatIdx) ? 0.15 : 0.08; // 模拟节奏感
        oscillators[i].freq(baseF, 0.2);
        oscillators[i].amp(volume, 0.1);
      }
    }
  }
}

function applyRoleGlitch(role, f) {
  let osc = oscillators[role];
  switch(role) {
    case 0: // BASS: 极低频失真
      osc.freq(f + random(-10, 10));
      osc.amp(random(0.4, 0.8));
      break;
    case 1: // GUITAR: 高频切音 (Stutter)
      osc.amp(frameCount % 2 === 0 ? 0.7 : 0);
      osc.freq(f * 1.5);
      break;
    case 2: // PIANO: 随机音高 (Shards)
      osc.freq(f * random([0.5, 1, 1.5, 2]));
      osc.amp(0.5);
      break;
    case 3: // LEAD: 数码尖叫 (Bitcrush)
      osc.freq(f + random(500, 2000));
      osc.amp(0.4);
      break;
  }
}

function drawRoleVisuals(role) {
  push();
  stroke(255);
  switch(role) {
    case 0: // BASS: 红色粗横线
      stroke(255, 50, 50);
      strokeWeight(20);
      line(0, random(height), width, random(height));
      break;
    case 1: // GUITAR: 白色细竖线
      stroke(255);
      strokeWeight(2);
      for(let i=0; i<5; i++) {
        let x = random(width);
        line(x, 0, x, height);
      }
      break;
    case 2: // PIANO: 蓝色方块
      fill(50, 50, 255, 150);
      noStroke();
      rect(random(width), random(height), 100, 100);
      break;
    case 3: // LEAD: 全屏反色闪烁
      fill(255);
      rect(0, 0, width, height);
      break;
  }
  pop();
}

async function initAudio() {
  userStartAudio();
  for (let i = 0; i < 4; i++) {
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
  fill(0); textAlign(CENTER, CENTER); textSize(18); text("CONDUCT", width/2, height/2);
  fill(255); text(statusText, width/2, height - 60);
}

async function mousePressed() {
  if (!isStarted && dist(mouseX, mouseY, width/2, height/2) < 70) {
    if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
      await DeviceOrientationEvent.requestPermission();
    }
    await initAudio();
  } else if (isStarted) {
    sendShake(); // 允许点击屏幕作为测试触发
  }
}

function deviceShaken() {
  if (isStarted) sendShake();
}

function sendShake() {
  socket.emit('shakeTrigger', { role: myRole, intensity: accelerationX });
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }