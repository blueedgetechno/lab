const game = { active: false, over: false, score: 0, apple: null, previousPointer: null, saved: null };
const gameHitBounds = new WeakMap();

function gamePointer() {
  return pointerPosition ? { x: pointerPosition.x * width, y: pointerPosition.y * height } : null;
}

function gameWorldPoint(point) {
  return {
    x: viewCenter.x + (point.x - width / 2) / zoom,
    y: viewCenter.y + (point.y - height / 2) / zoom
  };
}

function gameFishAt(point) {
  const world = gameWorldPoint(point);
  const bounds = swimmingBounds();
  return fishes.some(fish => {
    const discs = fish.collisionDiscs();
    let cached = gameHitBounds.get(fish);
    if (!cached || cached.discs !== discs) {
      cached = { discs, box: collisionBox(discs) };
      gameHitBounds.set(fish, cached);
    }
    const box = cached.box;
    if (Math.abs(periodicDelta(world.x - box.x, bounds.right - bounds.left)) > box.halfWidth ||
        Math.abs(periodicDelta(world.y - box.y, bounds.bottom - bounds.top)) > box.halfHeight) return false;
    return portalOffsets(fish).some(offset => fish.containsPoint(world.x - offset.horizontal, world.y - offset.vertical));
  });
}

function gamePointClear(point, clearance) {
  const world = gameWorldPoint(point);
  const bounds = swimmingBounds();
  return fishes.every(fish => fish.collisionDiscs().every(disc => Math.hypot(
    periodicDelta(disc.x - world.x, bounds.right - bounds.left),
    periodicDelta(disc.y - world.y, bounds.bottom - bounds.top)
  ) > disc.radius + clearance / zoom));
}

function placeGameApple() {
  const pointer = gamePointer();
  game.apple = null;
  for (let attempt = 0; attempt < 300; attempt++) {
    const point = { x: random(24, Math.max(25, width - 24)), y: random(80, Math.max(81, height - 24)) };
    if (pointer && Math.hypot(point.x - pointer.x, point.y - pointer.y) < 60) continue;
    if (!gamePointClear(point, 24)) continue;
    game.apple = point;
    return;
  }
}

function addGameFish(color) {
  const fish = createFish(color);
  const pointer = gamePointer() || { x: width / 2, y: height / 2 };
  const target = gameWorldPoint(pointer);
  const bounds = swimmingBounds();
  const discs = fish.collisionDiscs();
  for (let attempt = 0; attempt < 300; attempt++) {
    const horizontal = random(bounds.left, bounds.right) - fish.head.x;
    const vertical = random(bounds.top, bounds.bottom) - fish.head.y;
    const shifted = discs.map(disc => ({ ...disc, x: disc.x + horizontal, y: disc.y + vertical }));
    if (shifted.some(disc => Math.hypot(
      periodicDelta(disc.x - target.x, bounds.right - bounds.left),
      periodicDelta(disc.y - target.y, bounds.bottom - bounds.top)
    ) < disc.radius + 80 / zoom)) continue;
    if (fishes.some(other => deepestOverlap(shifted, other.collisionDiscs(), bounds))) continue;
    fish.translate(horizontal, vertical);
    fishes.push(fish);
    wrapFish(fish);
    return true;
  }
  return false;
}

function updateGameScore() {
  document.querySelector('#game-score').textContent = `Score ${game.score} | ${(1 + game.score / 10).toFixed(1)}x`;
}

function startGame() {
  if (!game.active) {
    game.saved = { fishes: fishes.slice(), zoom, center: viewCenter.clone(), stage, playing, playbackSpeed, followMouse };
  }
  game.active = true;
  game.over = false;
  game.score = 0;
  game.previousPointer = null;
  fishes.length = 0;
  zoom = 0.25;
  stage = 3;
  playing = true;
  followMouse = true;
  playbackSpeed = 1;
  viewCenter.set(width / 2, height / 2);
  addGameFish('blue');
  placeGameApple();
  document.querySelector('#game-score').hidden = false;
  document.querySelector('#fps-counter').hidden = true;
  document.querySelector('#game-over').hidden = true;
  updateGameScore();
}

function stopGame() {
  if (!game.active) return;
  const saved = game.saved;
  game.active = false;
  game.over = false;
  game.apple = null;
  game.previousPointer = null;
  fishes.splice(0, fishes.length, ...saved.fishes);
  zoom = saved.zoom;
  viewCenter.set(saved.center.x, saved.center.y);
  stage = saved.stage;
  playing = saved.playing;
  playbackSpeed = saved.playbackSpeed;
  followMouse = saved.followMouse;
  game.saved = null;
  document.querySelector('#game-score').hidden = true;
  document.querySelector('#game-over').hidden = true;
  document.querySelector('#fps-counter').hidden = false;
}

function gameCanRun() {
  return !game.over && pointerInside && document.hasFocus() && document.querySelector('#context-menu').hidden;
}

function endGame() {
  game.over = true;
  document.querySelector('#game-result').textContent = `Game over | Score ${game.score}`;
  document.querySelector('#game-over').hidden = false;
}

function updateGame() {
  if (!game.active || !gameCanRun()) {
    game.previousPointer = null;
    return;
  }
  const pointer = gamePointer();
  if (!pointer) return;
  const previous = game.previousPointer || pointer;
  const distance = Math.hypot(pointer.x - previous.x, pointer.y - previous.y);
  const steps = Math.max(1, Math.ceil(distance / 2));
  let collected = false;
  for (let step = 0; step <= steps; step++) {
    const point = { x: previous.x + (pointer.x - previous.x) * step / steps, y: previous.y + (pointer.y - previous.y) * step / steps };
    if (gameFishAt(point)) { endGame(); return; }
    if (game.apple && Math.hypot(point.x - game.apple.x, point.y - game.apple.y) <= 16) collected = true;
  }
  game.previousPointer = pointer;
  if (collected) {
    if (!addGameFish(random(['blue', ...Object.keys(fishSpecies)]))) return;
    game.score++;
    playbackSpeed = 1 + game.score / 10;
    updateGameScore();
    placeGameApple();
  } else if (!game.apple) placeGameApple();
}

function drawGame() {
  if (!game.active || !game.apple) return;
  push();
  translate(game.apple.x, game.apple.y);
  stroke('#702c30');
  strokeWeight(1.5);
  fill('#e74e51');
  beginShape();
  vertex(0, -9);
  bezierVertex(-20, -20, -19, 16, -5, 15);
  bezierVertex(-1, 13, 1, 13, 5, 15);
  bezierVertex(19, 16, 20, -20, 0, -9);
  endShape(CLOSE);
  stroke('#526333');
  line(0, -8, 2, -17);
  noStroke();
  fill('#648d39');
  ellipse(7, -15, 11, 5);
  fill('#ffb0a3');
  ellipse(-8, -3, 4, 7);
  pop();
}