let socket, myRole = -1, isStarted = false;
let oscillators = []; 
let envelopes = [];
let drone;
let bgAlpha = 0;
let activeColor;
let statusText = "Connecting...";

const instruments = [
    { name: "Double Bass", wave: 'sawtooth', base: 65, color: [255, 50, 50] },   // Red
    { name: "Violin", wave: 'sawtooth', base: 261, color: [50, 255, 50] },        // Green
    { name: "Flute", wave: 'triangle', base: 523, color: [50, 50, 255] },         // Blue
    { name: "Trumpet", wave: 'square', base: 392, color: [255, 255, 50] }        // Yellow
];

function setup() {
    createCanvas(windowWidth, windowHeight);
    activeColor = color(0);
    socket = io();

    socket.on('assignRole', (role) => { 
        myRole = role; 
        statusText = "Ready: " + instruments[myRole].name;
    });

    socket.on('broadcastAction', (data) => {
        if (isStarted) triggerPerformance(data.role, data.tilt);
    });
}

function draw() {
    background(red(activeColor) * bgAlpha, green(activeColor) * bgAlpha, blue(activeColor) * bgAlpha);
    if (bgAlpha > 0) bgAlpha -= 0.04; 

    if (!isStarted) {
        fill(255);
        noStroke();
        ellipse(width/2, height/2, 140);
        fill(0);
        textAlign(CENTER, CENTER);
        textStyle(BOLD);
        text("CONDUCT", width/2, height/2);
        
        fill(255);
        textStyle(NORMAL);
        text(statusText, width/2, height - 60);
    } else {
        fill(255, 200);
        textAlign(CENTER);
        textSize(24);
        text(instruments[myRole].name.toUpperCase(), width/2, height/2);
        textSize(14);
        text("SHAKE OR TAP TO PLAY", width/2, height/2 + 40);
    }
}

async function initAudio() {
    if (getAudioContext().state !== 'running') await getAudioContext().resume();

    for (let i = 0; i < 4; i++) {
        let env = new p5.Envelope();
        env.setADSR(0.05, 0.1, 0.4, 0.8);
        envelopes.push(env);

        let osc = new p5.Oscillator(instruments[i].wave);
        osc.amp(env);
        osc.start();
        oscillators.push(osc);
    }

    drone = new p5.Oscillator('sine');
    drone.freq(65.4); // Low C
    drone.amp(0.04);
    drone.start();

    isStarted = true;
}

async function mousePressed() {
    if (!isStarted) {
        if (dist(mouseX, mouseY, width/2, height/2) < 70) {
            if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
                try { await DeviceOrientationEvent.requestPermission(); } catch (e) {}
            }
            await initAudio();
        }
    } else {
        sendAction();
    }
}

function sendAction() {
    if (socket && myRole !== -1) {
        socket.emit('shakeTrigger', { role: myRole, tilt: rotationX });
    }
}

function deviceShaken() {
    if (isStarted) sendAction();
}

function triggerPerformance(role, tilt) {
    if (envelopes[role]) {
        let notes = [1, 1.125, 1.25, 1.5, 1.66]; // Pentatonic
        let idx = floor(map(constrain(tilt, -45, 45), -45, 45, 0, 5));
        
        oscillators[role].freq(instruments[role].base * notes[idx], 0.05);
        envelopes[role].play();

        let c = instruments[role].color;
        activeColor = color(c[0], c[1], c[2]);
        bgAlpha = 0.6; 
    }
}