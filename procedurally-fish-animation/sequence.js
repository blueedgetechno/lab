let videoSequence = null;

function startVideoSequence() {
  if (videoSequence || recordingStopping || (recorder && recorder.state !== 'inactive')) return;
  startRecording(document.querySelector('canvas'));
  if (!recorder || recorder.state !== 'recording') return;
  fishes.length = 0;
  viewCenter.set(width / 2, height / 2);
  zoom = 1;
  stage = 3;
  playbackSpeed = 1;
  playing = true;
  followMouse = true;
  pointerPosition = { x: 0.6, y: 0.5 };
  pointerInside = true;
  addFish('blue');
  const fish = fishes[0];
  fish.translate(width / 2 - fish.head.x, height / 2 - fish.head.y);
  document.querySelector('#menu-hint').hidden = true;
  videoSequence = {
    startedAt: performance.now(), nextEvent: 0,
    events: [
      [3, () => sequenceStage(0)],
      [4.5, () => sequenceStage(1)],
      [6, () => sequenceStage(2)],
      [7.5, () => sequenceStage(3)],
      [9.5, () => addFish('clownfish')],
      [12, () => setZoom(0.5)],
      [12.5, () => addFish('koi')],
      [13.2, () => addFish('betta')],
      [13.9, () => addFish('neonTetra')],
      [14.6, () => addFish('guppy')],
      [15.3, () => addFish('discus')],
      [16, () => addFish('mandarin')],
      [16.7, () => addFish('rainbowParrotfish')],
      [17.4, () => addFish('powderBlueTang')]
    ]
  };
}

function sequenceStage(value) {
  document.dispatchEvent(new KeyboardEvent('keydown', { code: `Numpad${value}`, key: String(value), bubbles: true }));
}

function updateVideoSequence(now) {
  if (!videoSequence) return;
  if (!recorder || recorder.state !== 'recording') {
    videoSequence = null;
    return;
  }
  const elapsed = (now - videoSequence.startedAt) / 1000;
  if (elapsed >= 21) {
    videoSequence = null;
    stopRecording();
    return;
  }
  while (videoSequence.nextEvent < videoSequence.events.length && elapsed >= videoSequence.events[videoSequence.nextEvent][0]) {
    videoSequence.events[videoSequence.nextEvent++][1]();
  }
  pointerInside = true;
  pointerPosition = {
    x: 0.5 + 0.16 * Math.cos(elapsed * 0.42),
    y: 0.52 + 0.15 * Math.sin(elapsed * 0.42)
  };
}

function drawVideoCaption() {
  if (!videoSequence) return;
  const elapsed = (performance.now() - videoSequence.startedAt) / 1000;
  const captions = [
    [0, 2.6, 'A fish, following a cursor'],
    [3, 4.4, 'A chain of points'],
    [4.5, 5.9, 'Give each point a radius'],
    [6, 7.4, 'Connect the outline'],
    [7.5, 9, 'Add fins and eyes'],
    [9.5, 11.6, 'Same rules. A clownfish.'],
    [12, 18.5, 'Now a whole school']
  ];
  const caption = captions.find(([start, end]) => elapsed >= start && elapsed < end);
  if (!caption) return;
  push();
  textFont('Space Grotesk');
  textSize(width < 500 ? 18 : 28);
  if (textWidth(caption[2]) > width - 40) textSize(textSize() * (width - 40) / textWidth(caption[2]));
  textAlign(CENTER, TOP);
  noStroke();
  fill('#263b36');
  text(caption[2], width / 2, height * 0.12);
  pop();
}