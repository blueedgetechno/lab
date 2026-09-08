const defaultBodyRadii = [23, 33, 37, 35, 30, 24, 18, 12, 10, 9, 8, 7];
const palettes = {
  blue: { body: '#4b86b4', outline: '#284f70', fin: '#99cddd', finOutline: '#467b9a', dorsal: '#badfec' },
  red: { body: '#ce6268', outline: '#793940', fin: '#efabb0', finOutline: '#a15b65', dorsal: '#f4c7ca' },
  yellow: { body: '#dfb844', outline: '#77602a', fin: '#efdb91', finOutline: '#a08746', dorsal: '#f5e8ba' }
};
for (const [key, species] of Object.entries(fishSpecies)) palettes[key] = species.palette;
const fishes = [];
let stage = 3;
let playing = true;
let playbackSpeed = 1;
let followMouse = false;
let pointerPosition = null;
let pointerInside = false;
let zoom = 1;
let viewCenter;
let recorder;
let recordingStream;
let recordingStopping = false;
let pendingResize = false;
let fpsCounter;
let fpsFrames = 0;
let fpsStartedAt = 0;

function setup() {
  fpsCounter = document.querySelector('#fps-counter');
  fpsStartedAt = performance.now();
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.elt.setAttribute('aria-label', 'Procedural fish canvas');
  canvas.elt.tabIndex = 0;
  pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
  viewCenter = new FIK.V2(width / 2, height / 2);
  addFish('blue');
  setupControls(canvas.elt);
  setupContextMenu(canvas.elt);
}

function addFish(color) {
  if (!palettes[color]) return;
  fishes.push(createFish(color));
  separateFishes(fishes);
  fishes.forEach(wrapFish);
}

function resetFish() {
  viewCenter.set(width / 2, height / 2);
  fishes.forEach(fish => fish.reset());
  separateFishes(fishes);
  fishes.forEach(wrapFish);
}

function updateSchool(elapsed) {
  fishes.forEach(fish => fish.update(elapsed));
  separateFishes(fishes);
  fishes.forEach(wrapFish);
}

function wrapFish(fish) {
  const bounds = swimmingBounds();
  const worldWidth = bounds.right - bounds.left;
  const worldHeight = bounds.bottom - bounds.top;
  const horizontal = -Math.floor((fish.head.x - bounds.left) / worldWidth) * worldWidth;
  const vertical = -Math.floor((fish.head.y - bounds.top) / worldHeight) * worldHeight;
  if (horizontal || vertical) fish.translate(horizontal, vertical);
}

function portalOffsets(fish) {
  const bounds = swimmingBounds();
  const discs = fish.collisionDiscs();
  const left = Math.min(...discs.map(disc => disc.x - disc.radius));
  const right = Math.max(...discs.map(disc => disc.x + disc.radius));
  const top = Math.min(...discs.map(disc => disc.y - disc.radius));
  const bottom = Math.max(...discs.map(disc => disc.y + disc.radius));
  const worldWidth = bounds.right - bounds.left;
  const worldHeight = bounds.bottom - bounds.top;
  const offsets = [];
  for (const horizontal of [-worldWidth, 0, worldWidth]) {
    for (const vertical of [-worldHeight, 0, worldHeight]) {
      if (right + horizontal >= bounds.left && left + horizontal <= bounds.right && bottom + vertical >= bounds.top && top + vertical <= bounds.bottom) {
        offsets.push({ horizontal, vertical });
      }
    }
  }
  return offsets;
}

function swimmingBounds() {
  return {
    left: viewCenter.x - width / (2 * zoom),
    right: viewCenter.x + width / (2 * zoom),
    top: viewCenter.y - height / (2 * zoom),
    bottom: viewCenter.y + height / (2 * zoom)
  };
}

function setZoom(value) {
  const nextZoom = constrain(value, 0.25, 1);
  if (nextZoom > zoom && fishes.length) {
    const points = fishes.flatMap(fish => fish.outline());
    viewCenter.set(
      (Math.min(...points.map(point => point.x)) + Math.max(...points.map(point => point.x))) / 2,
      (Math.min(...points.map(point => point.y)) + Math.max(...points.map(point => point.y))) / 2
    );
  }
  zoom = nextZoom;
  fishes.forEach(wrapFish);
  separateFishes(fishes);
  fishes.forEach(wrapFish);
}

function draw() {
  fpsFrames++;
  const now = performance.now();
  if (typeof updateVideoSequence === 'function') updateVideoSequence(now);
  if (now - fpsStartedAt >= 500) {
    fpsCounter.textContent = `${Math.round(fpsFrames * 1000 / (now - fpsStartedAt))} FPS`;
    fpsStartedAt = now;
    fpsFrames = 0;
  }
  if (playing) {
    let remaining = Math.min(deltaTime / 1000, 0.04) * playbackSpeed;
    while (remaining > 0) {
      const elapsed = Math.min(remaining, 1 / 60);
      updateSchool(elapsed);
      remaining -= elapsed;
    }
  }
  background('#f4f6f5');
  push();
  translate(width / 2, height / 2);
  scale(zoom);
  translate(-viewCenter.x, -viewCenter.y);
  for (const fish of fishes) {
    for (const offset of portalOffsets(fish)) {
      push();
      translate(offset.horizontal, offset.vertical);
      fish.draw();
      pop();
    }
  }
  pop();
  if (pointerInside && pointerPosition) {
    push();
    translate(pointerPosition.x * width, pointerPosition.y * height);
    noStroke();
    fill('#000000');
    beginShape();
    vertex(0, 0);
    vertex(0, 19);
    vertex(5, 15);
    vertex(9, 23);
    vertex(12, 21);
    vertex(8, 13);
    vertex(16, 13);
    endShape(CLOSE);
    pop();
  }
  if (typeof drawVideoCaption === 'function') drawVideoCaption();
}

function createFish(color) {
const palette = palettes[color];
const species = fishSpecies[color];
const bodyRadii = species?.radii || defaultBodyRadii;
const variation = random(TWO_PI);
const markings = species ? createSpeciesPattern(species, variation) : [];
let finGeometry = [];
let cachedCollisionDiscs = null;
let instance;
let spine;
let joints = [];
let headings = [];
let headingDeltas = [];
let fishScale;
let segmentLength;
let head;
let destination;
let heading = 0;
let gazeHeading = 0;
let turnStartsAt = 0;
let swimTime = 0;
let nextDestination = 0;
let totalCurvature = 0;

function resetFish() {
  fishScale = Math.min(width / 820, height / 620, 1.25) * (species?.size || 1);
  if (instance) passingTurns.delete(instance);
  segmentLength = (species?.spacing || 22) * fishScale;
  heading = random(-PI, PI);
  head = new FIK.V2(viewCenter.x + random(-width * 0.15, width * 0.15) / zoom, viewCenter.y + random(-height * 0.15, height * 0.15) / zoom);
  gazeHeading = heading;
  swimTime = 0;
  nextDestination = 0;
  spine = new FIK.Chain2D();
  const direction = new FIK.V2(Math.cos(heading), Math.sin(heading));
  const tail = new FIK.V2(head.x - direction.x * segmentLength * (bodyRadii.length - 1), head.y - direction.y * segmentLength * (bodyRadii.length - 1));
  spine.addBone(new FIK.Bone2D(tail, new FIK.V2(tail.x + direction.x * segmentLength, tail.y + direction.y * segmentLength)));
  for (let index = 1; index < bodyRadii.length - 1; index++) {
    spine.addConsecutiveBone(direction, segmentLength, species?.flexibility || 12, species?.flexibility || 12);
  }
  spine.setFixedBaseMode(false);
  spine.setSolveDistanceThreshold(0.01);
  chooseDestination();
  if (followMouse) destination.set(head.x, head.y);
  updateGeometry();
}

function chooseDestination() {
  const bounds = swimmingBounds();
  destination = new FIK.V2(random(bounds.left, bounds.right), random(bounds.top, bounds.bottom));
  nextDestination = swimTime + random(2, 4) / zoom;
  turnStartsAt = swimTime + 0.22;
}

function wrapAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function updatePointerDestination() {
  if (!pointerPosition) return;
  destination.set(
    viewCenter.x + (pointerPosition.x - 0.5) * width / zoom,
    viewCenter.y + (pointerPosition.y - 0.5) * height / zoom
  );
}

function updateFish(elapsed) {
  swimTime += elapsed;
  const following = followMouse && pointerPosition !== null;
  if (following) {
    updatePointerDestination();
  } else if (swimTime >= nextDestination || head.distanceTo(destination) < segmentLength * 2) {
    chooseDestination();
  }
  const bounds = swimmingBounds();
  const targetX = periodicDelta(destination.x - head.x, bounds.right - bounds.left);
  const targetY = periodicDelta(destination.y - head.y, bounds.bottom - bounds.top);
  const distance = Math.hypot(targetX, targetY);
  const orbitRadius = segmentLength * 8;
  const radialAngle = distance < fishScale ? heading - HALF_PI : Math.atan2(-targetY, -targetX);
  const targetHeading = following
    ? radialAngle + HALF_PI + Math.atan((distance - orbitRadius) / (orbitRadius * 0.6))
    : Math.atan2(targetY, targetX);
  const avoidance = avoidanceHeading(instance, targetHeading, fishes);
  const desired = avoidance.angle;
  const gazeTarget = headings[0] + constrain(wrapAngle(desired - headings[0]), -1.1, 1.1);
  gazeHeading += wrapAngle(gazeTarget - gazeHeading) * (1 - Math.exp(-14 * elapsed));
  const steering = wrapAngle(desired - heading);
  if (following || avoidance.active || swimTime >= turnStartsAt) heading += constrain(steering, -0.85 * elapsed, 0.85 * elapsed);
  const swimHeading = heading + Math.sin(swimTime * 5) * 0.06;
  const speed = (species?.speed || 92) * fishScale;
  head.x += Math.cos(swimHeading) * speed * elapsed;
  head.y += Math.sin(swimHeading) * speed * elapsed;
  spine.solveForTarget(head);
  updateGeometry();
}

function updateGeometry() {
  cachedCollisionDiscs = null;
  joints = [spine.getEffectorLocation().clone(), ...spine.bones.slice().reverse().map(bone => bone.start.clone())];
  headings = joints.map((joint, index) => {
    const front = joints[Math.max(0, index - 1)];
    const back = joints[Math.min(joints.length - 1, index + 1)];
    return Math.atan2(front.y - back.y, front.x - back.x);
  });
  totalCurvature = 0;
  headingDeltas = [];
  for (let index = 1; index < headings.length; index++) {
    const difference = wrapAngle(headings[index] - headings[index - 1]);
    headingDeltas.push(difference);
    totalCurvature += difference;
  }
  if (species) finGeometry = speciesFinGeometry(species, sampleBody, fishScale, totalCurvature, swimTime);
}

function drawFish() {
  if (stage === 3) drawFins();
  if (stage >= 2) drawBody();
  if (stage === 1 || stage === 2) drawCircles();
  if (stage < 3) drawSpine();
  if (stage === 3) {
    drawDorsalFin();
    drawEyes();
  }
}

function bodyPoint(index, angle, radius = bodyRadii[index] * fishScale) {
  return {
    x: joints[index].x + Math.cos(headings[index] + angle) * radius,
    y: joints[index].y + Math.sin(headings[index] + angle) * radius
  };
}

function sampleBody(segment, lateral) {
  const bounded = Math.max(0, Math.min(segment, joints.length - 1));
  const index = Math.min(Math.floor(bounded), joints.length - 2);
  const progress = bounded - index;
  const angle = headings[index] + headingDeltas[index] * progress;
  const radius = (bodyRadii[index] + (bodyRadii[index + 1] - bodyRadii[index]) * progress) * fishScale;
  const extension = (segment - bounded) * segmentLength;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return {
    x: joints[index].x + (joints[index + 1].x - joints[index].x) * progress - cosine * extension - sine * radius * lateral,
    y: joints[index].y + (joints[index + 1].y - joints[index].y) * progress - sine * extension + cosine * radius * lateral,
    angle
  };
}

function bodyClipPath(points) {
  const path = new Path2D();
  const last = points[points.length - 1];
  path.moveTo((last.x + points[0].x) / 2, (last.y + points[0].y) / 2);
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    path.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
  });
  path.closePath();
  return path;
}

function closedCurve(points) {
  beginShape();
  const last = points[points.length - 1];
  vertex((last.x + points[0].x) / 2, (last.y + points[0].y) / 2);
  for (let index = 0; index < points.length; index++) {
    const point = points[index];
    const next = points[(index + 1) % points.length];
    quadraticVertex(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
  }
  endShape(CLOSE);
}

function bodyOutline() {
  const outline = [];
  for (let angle = -HALF_PI; angle <= HALF_PI + 0.01; angle += PI / 8) {
    outline.push(bodyPoint(0, angle));
  }
  for (let index = 1; index < joints.length; index++) outline.push(bodyPoint(index, HALF_PI));
  const last = joints.length - 1;
  for (let angle = HALF_PI + PI / 4; angle < PI * 1.5; angle += PI / 4) {
    outline.push(bodyPoint(last, angle));
  }
  for (let index = last; index > 0; index--) outline.push(bodyPoint(index, -HALF_PI));
  return outline;
}

function drawBody() {
  stroke(palette.outline);
  strokeWeight(2);
  fill(stage === 3 ? palette.body : '#dcebf580');
  if (stage === 3 && species?.pattern === 'clown') {
    drawingContext.fillStyle = clownfishGradient(sampleBody);
  }
  closedCurve(bodyOutline());
  if (stage === 3 && species) {
    push();
    drawingContext.save();
    drawingContext.clip(bodyClipPath(bodyOutline()));
    for (const marking of markings) {
      drawingContext.fillStyle = marking.color;
      drawingContext.fill(bodyClipPath(marking.points.map(point => sampleBody(point.segment, point.lateral))));
    }
    drawingContext.restore();
    pop();
    noFill();
    stroke(palette.outline);
    strokeWeight(2);
    closedCurve(bodyOutline());
  }
}

function drawCircles() {
  drawingContext.setLineDash(stage === 2 ? [5, 5] : []);
  stroke(stage === 2 ? '#779cb8' : '#467da6');
  strokeWeight(1.2);
  fill(stage === 2 ? '#ffffff00' : '#b7d5ec30');
  for (let index = 0; index < joints.length; index++) {
    circle(joints[index].x, joints[index].y, bodyRadii[index] * fishScale * 2);
  }
  drawingContext.setLineDash([]);
}

function drawFins() {
  if (species) {
    for (const fin of finGeometry) {
      stroke(palette.finOutline);
      strokeWeight(1.5);
      fill(fin.fill);
      closedCurve(fin.points);
    }
    return;
  }
  for (const index of [3, 7]) {
    for (const side of [-1, 1]) {
      const anchor = bodyPoint(index, side * HALF_PI, bodyRadii[index] * fishScale * 0.85);
      const finLength = (index === 3 ? 66 : 38) * fishScale;
      push();
      translate(anchor.x, anchor.y);
      rotate(headings[index - 1] - side * 0.62);
      stroke(palette.finOutline);
      strokeWeight(1.5);
      fill(palette.fin);
      ellipse(-finLength * 0.22, 0, finLength, finLength * 0.38);
      pop();
    }
  }
  drawTailFin();
}

function tailOutline() {
  if (species) return finGeometry[finGeometry.length - 1].points;
  const last = joints.length - 1;
  const root = joints[last];
  const angle = headings[last];
  const bend = Math.tanh(totalCurvature * 0.65) * 7;
  const spread = Math.tanh(Math.abs(totalCurvature) * 1.2);
  const profile = [[0, 5], [12, 6], [26, 10], [40, 14], [46, 12]];
  const pointAt = (distance, halfWidth) => {
    const widthFactor = 1 - (1 - spread) * 0.8 * Math.min(distance / 26, 1);
    const offset = (bend * (distance / 50) ** 2 + halfWidth * widthFactor) * fishScale;
    return {
      x: root.x - Math.cos(angle) * distance * fishScale - Math.sin(angle) * offset,
      y: root.y - Math.sin(angle) * distance * fishScale + Math.cos(angle) * offset
    };
  };
  return [
    ...profile.map(([distance, halfWidth]) => pointAt(distance, halfWidth)),
    pointAt(50, 0),
    ...profile.slice().reverse().map(([distance, halfWidth]) => pointAt(distance, -halfWidth))
  ];
}

function drawTailFin() {
  stroke(palette.finOutline);
  strokeWeight(1.5);
  fill(palette.fin);
  closedCurve(tailOutline());
}

function drawDorsalFin() {
  if (species) return;
  const centers = joints.slice(2, 9);
  const curvature = constrain(totalCurvature, -2, 2);
  const edge = centers.map((center, index) => {
    const progress = index / (centers.length - 1);
    const offset = Math.sin(progress * PI) * curvature * 8 * fishScale;
    const angle = headings[index + 2] + HALF_PI;
    return { x: center.x + Math.cos(angle) * offset, y: center.y + Math.sin(angle) * offset };
  });
  stroke(palette.finOutline);
  strokeWeight(1.3);
  fill(palette.dorsal);
  closedCurve([...centers, ...edge.slice(1, -1).reverse()]);
}

function drawEyes() {
  if (species?.barbels) {
    stroke(palette.outline);
    strokeWeight(1.2);
    noFill();
    for (const side of [-1, 1]) {
      const start = bodyPoint(0, side * 0.45, bodyRadii[0] * fishScale);
      const end = bodyPoint(0, side * 0.75, (bodyRadii[0] + 12) * fishScale);
      line(start.x, start.y, end.x, end.y);
    }
  }
  if (species?.beak) {
    const point = bodyPoint(0, 0, bodyRadii[0] * fishScale * 0.8);
    push();
    translate(point.x, point.y);
    rotate(headings[0]);
    fill('#e4f2cf');
    stroke(palette.outline);
    strokeWeight(1);
    ellipse(0, 0, 11 * fishScale, 18 * fishScale);
    line(2 * fishScale, -7 * fishScale, 2 * fishScale, 7 * fishScale);
    pop();
  }
  const gazeOffset = constrain(wrapAngle(gazeHeading - headings[0]), -1.1, 1.1);
  for (const side of [-1, 1]) {
    const eye = bodyPoint(0, side * 1.05 + gazeOffset * 0.2, bodyRadii[0] * fishScale * 0.8);
    if (species?.pattern === 'clown') {
      noStroke();
      fill('#000000');
      circle(eye.x, eye.y, Math.min(13, bodyRadii[0] * 0.55) * fishScale);
      continue;
    }
    stroke(palette.outline);
    strokeWeight(1.5);
    fill('#ffffff');
    const eyeSize = (species ? Math.min(13, bodyRadii[0] * 0.55) : 13) * fishScale;
    circle(eye.x, eye.y, eyeSize);
    noStroke();
    fill('#233e53');
    const lookAngle = headings[0] + gazeOffset;
    const pupilOffset = species ? eyeSize * 0.2 : 3 * fishScale;
    circle(eye.x + Math.cos(lookAngle) * pupilOffset, eye.y + Math.sin(lookAngle) * pupilOffset, species ? eyeSize * 0.46 : 6 * fishScale);
  }
}

function drawSpine() {
  stroke('#467da6');
  strokeWeight(2);
  noFill();
  beginShape();
  for (const joint of joints) vertex(joint.x, joint.y);
  endShape();
  for (let index = 0; index < joints.length; index++) {
    fill(index === 0 ? '#df673e' : '#ffffff');
    circle(joints[index].x, joints[index].y, index === 0 ? 11 : 7);
  }
}

function collisionDiscs() {
  if (cachedCollisionDiscs) return cachedCollisionDiscs;
  const radii = bodyRadii.map((radius, index) => ((species ? radius : index === 3 ? 76 : index === 7 ? 42 : radius) + 4) * fishScale);
  if (species?.barbels) radii[0] += 12 * fishScale;
  const discs = joints.map((joint, index) => ({ x: joint.x, y: joint.y, radius: radii[index] }));
  for (let index = 1; index < joints.length; index++) {
    discs.push({
      x: (joints[index - 1].x + joints[index].x) / 2,
      y: (joints[index - 1].y + joints[index].y) / 2,
      radius: Math.max(radii[index - 1], radii[index])
    });
  }
  if (species) {
    for (const fin of finGeometry) {
      const center = {
        x: (Math.min(...fin.points.map(point => point.x)) + Math.max(...fin.points.map(point => point.x))) / 2,
        y: (Math.min(...fin.points.map(point => point.y)) + Math.max(...fin.points.map(point => point.y))) / 2
      };
      const radius = Math.max(...fin.points.map(point => Math.hypot(point.x - center.x, point.y - center.y))) + 2;
      discs.push({ ...center, radius });
    }
  } else {
    for (const distance of [15, 35, 50]) {
      const point = bodyPoint(joints.length - 1, PI, distance * fishScale);
      discs.push({ ...point, radius: 26 * fishScale });
    }
  }
  cachedCollisionDiscs = discs;
  return discs;
}

function containsPoint(horizontal, vertical) {
  const paths = [bodyClipPath(bodyOutline())];
  if (stage === 3) {
    if (species) {
      paths.push(...finGeometry.map(fin => bodyClipPath(fin.points)));
    } else {
      paths.push(bodyClipPath(tailOutline()));
      for (const index of [3, 7]) {
        for (const side of [-1, 1]) {
          const anchor = bodyPoint(index, side * HALF_PI, bodyRadii[index] * fishScale * 0.85);
          const length = (index === 3 ? 66 : 38) * fishScale;
          const angle = headings[index - 1] - side * 0.62;
          const path = new Path2D();
          path.ellipse(anchor.x - Math.cos(angle) * length * 0.22, anchor.y - Math.sin(angle) * length * 0.22, length / 2, length * 0.19, angle, 0, TWO_PI);
          paths.push(path);
        }
      }
    }
  }
  drawingContext.save();
  drawingContext.resetTransform();
  const hit = paths.some(path => drawingContext.isPointInPath(path, horizontal, vertical));
  drawingContext.restore();
  return hit;
}

function translateFish(horizontal, vertical) {
  head.x += horizontal;
  head.y += vertical;
  for (const bone of spine.bones) {
    bone.start.x += horizontal;
    bone.start.y += vertical;
    bone.end.x += horizontal;
    bone.end.y += vertical;
  }
  spine.resetTarget();
  updateGeometry();
}

resetFish();
instance = {
  color,
  species,
  update: updateFish,
  draw: drawFish,
  reset: resetFish,
  collisionDiscs,
  containsPoint,
  translate: translateFish,
  outline: () => [...bodyOutline(), ...tailOutline(), ...finGeometry.flatMap(fin => fin.points)],
  get fins() { return finGeometry; },
  get head() { return head; },
  get heading() { return heading; },
  get joints() { return joints; },
  get segmentLength() { return segmentLength; },
  get swimTime() { return swimTime; }
};
return instance;
}

function windowResized() {
  if (recorder && recorder.state !== 'inactive') {
    pendingResize = true;
    return;
  }
  const canvasHeight = Math.max(1, windowHeight);
  if (width === windowWidth && height === canvasHeight) return;
  resizeCanvas(windowWidth, canvasHeight);
  resetFish();
}

function setPlaying(value) {
  playing = value;
}

function setupControls(canvas) {
  canvas.style.cursor = 'none';

  canvas.addEventListener('dblclick', event => {
    if (event.button !== 0) return;
    const bounds = canvas.getBoundingClientRect();
    const horizontal = viewCenter.x + ((event.clientX - bounds.left) / bounds.width - 0.5) * width / zoom;
    const vertical = viewCenter.y + ((event.clientY - bounds.top) / bounds.height - 0.5) * height / zoom;
    for (let index = fishes.length - 1; index >= 0; index--) {
      const fish = fishes[index];
      if (portalOffsets(fish).some(offset => fish.containsPoint(horizontal - offset.horizontal, vertical - offset.vertical))) {
        fishes.splice(index, 1);
        event.preventDefault();
        break;
      }
    }
  });

  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.altKey || event.metaKey || !/^Numpad[0-389]$/.test(event.code)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.repeat) return;
    if (/^Numpad[0-3]$/.test(event.code)) stage = Number(event.code.slice(-1));
    if (event.code === 'Numpad8') startRecording(canvas);
    if (event.code === 'Numpad9') stopRecording();
  }, true);
  const trackPointer = event => {
    pointerInside = true;
    const bounds = canvas.getBoundingClientRect();
    pointerPosition = {
      x: constrain((event.clientX - bounds.left) / bounds.width, 0, 1),
      y: constrain((event.clientY - bounds.top) / bounds.height, 0, 1)
    };
  };
  canvas.addEventListener('pointermove', trackPointer);
  canvas.addEventListener('pointerdown', trackPointer);
  canvas.addEventListener('pointerenter', trackPointer);
  canvas.addEventListener('pointerleave', () => { pointerInside = false; });
  canvas.addEventListener('pointercancel', () => { pointerInside = false; });
  canvas.addEventListener('pointerup', event => {
    if (event.pointerType === 'touch') pointerInside = false;
  });
  canvas.addEventListener('keydown', event => {
    if (event.key === ' ') { event.preventDefault(); setPlaying(!playing); }
    if (/^[0-3]$/.test(event.key)) stage = Number(event.key);
    if (event.key === '.') { setPlaying(false); updateSchool(playbackSpeed / 60); }
  });
}

function stopRecording() {
  if (!recorder || recorder.state === 'inactive' || recordingStopping) return;
  recordingStopping = true;
  recorder.stop();
}

function startRecording(canvas) {
  if (recordingStopping || (recorder && recorder.state !== 'inactive')) return;
  const chunks = [];
  try {
    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find(type => MediaRecorder.isTypeSupported(type));
    recordingStream = canvas.captureStream(60);
    recorder = new MediaRecorder(recordingStream, mimeType ? { mimeType } : {});
    recorder.ondataavailable = event => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onstop = () => {
      const type = recorder.mimeType;
      const url = URL.createObjectURL(new Blob(chunks, { type }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `procedural-fish.${type.includes('mp4') ? 'mp4' : 'webm'}`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      finishRecording();
    };
    recorder.onerror = () => {
      recorder.onstop = finishRecording;
      finishRecording(false);
    };
    recorder.start();
    document.querySelector('#recording-indicator').hidden = false;
  } catch (error) {
    console.error('Recording failed:', error);
    finishRecording(false);
  }
}

function finishRecording() {
  document.querySelector('#recording-indicator').hidden = true;
  recordingStream?.getTracks().forEach(track => track.stop());
  recordingStopping = false;
  if (pendingResize) {
    pendingResize = false;
    windowResized();
  }
}