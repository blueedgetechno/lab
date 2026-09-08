function periodicDelta(value, span) {
  return value - Math.round(value / span) * span;
}

function collisionBox(discs) {
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (const disc of discs) {
    left = Math.min(left, disc.x - disc.radius);
    right = Math.max(right, disc.x + disc.radius);
    top = Math.min(top, disc.y - disc.radius);
    bottom = Math.max(bottom, disc.y + disc.radius);
  }
  return { x: (left + right) / 2, y: (top + bottom) / 2, halfWidth: (right - left) / 2, halfHeight: (bottom - top) / 2 };
}

function deepestOverlap(first, second, bounds = null) {
  if (!first.length || !second.length) return null;
  const firstBox = collisionBox(first);
  const secondBox = collisionBox(second);
  const horizontalGap = bounds ? periodicDelta(secondBox.x - firstBox.x, bounds.right - bounds.left) : secondBox.x - firstBox.x;
  const verticalGap = bounds ? periodicDelta(secondBox.y - firstBox.y, bounds.bottom - bounds.top) : secondBox.y - firstBox.y;
  if (Math.abs(horizontalGap) >= firstBox.halfWidth + secondBox.halfWidth || Math.abs(verticalGap) >= firstBox.halfHeight + secondBox.halfHeight) return null;
  let deepest = null;
  for (const firstDisc of first) {
    for (const secondDisc of second) {
      const horizontal = bounds ? periodicDelta(secondDisc.x - firstDisc.x, bounds.right - bounds.left) : secondDisc.x - firstDisc.x;
      const vertical = bounds ? periodicDelta(secondDisc.y - firstDisc.y, bounds.bottom - bounds.top) : secondDisc.y - firstDisc.y;
      const radius = firstDisc.radius + secondDisc.radius;
      if (Math.abs(horizontal) >= radius || Math.abs(vertical) >= radius) continue;
      const distance = Math.hypot(horizontal, vertical);
      const depth = radius - distance;
      if (depth > 0 && (!deepest || depth > deepest.depth)) {
        deepest = {
          depth,
          horizontal: distance > 0.0001 ? horizontal / distance : 1,
          vertical: distance > 0.0001 ? vertical / distance : 0
        };
      }
    }
  }
  return deepest;
}

function separateFishes(school, bounds = swimmingBounds()) {
  const boundaries = school.map(fish => fish.collisionDiscs());
  const move = (index, horizontal, vertical) => {
    school[index].translate(horizontal, vertical);
    for (const disc of boundaries[index]) {
      disc.x += horizontal;
      disc.y += vertical;
    }
  };
  for (let iteration = 0; iteration < 48; iteration++) {
    let changed = false;
    for (let first = 0; first < school.length; first++) {
      for (let second = first + 1; second < school.length; second++) {
        const overlap = deepestOverlap(boundaries[first], boundaries[second], bounds);
        if (!overlap) continue;
        commitSeparationTurn(school[first], -overlap.horizontal, -overlap.vertical);
        commitSeparationTurn(school[second], overlap.horizontal, overlap.vertical);
        const distance = overlap.depth / 2 + 0.05;
        move(first, -overlap.horizontal * distance, -overlap.vertical * distance);
        move(second, overlap.horizontal * distance, overlap.vertical * distance);
        changed = true;
      }
    }
    if (!changed) return;
  }
  for (let index = 1; index < school.length; index++) {
    const previous = boundaries.slice(0, index);
    if (!previous.some(boundary => deepestOverlap(boundary, boundaries[index], bounds))) continue;
    const candidates = [];
    for (let column = 0; column < 16; column++) {
      for (let row = 0; row < 16; row++) {
        candidates.push({
          horizontal: periodicDelta(bounds.left + (column + 0.5) * (bounds.right - bounds.left) / 16 - school[index].head.x, bounds.right - bounds.left),
          vertical: periodicDelta(bounds.top + (row + 0.5) * (bounds.bottom - bounds.top) / 16 - school[index].head.y, bounds.bottom - bounds.top)
        });
      }
    }
    candidates.sort((first, second) => Math.hypot(first.horizontal, first.vertical) - Math.hypot(second.horizontal, second.vertical));
    const free = candidates.find(candidate => {
      const shifted = boundaries[index].map(disc => ({ ...disc, x: disc.x + candidate.horizontal, y: disc.y + candidate.vertical }));
      return previous.every(boundary => !deepestOverlap(boundary, shifted, bounds));
    });
    if (!free) return false;
    move(index, free.horizontal, free.vertical);
  }
  return true;
}

const passingTurns = new WeakMap();

function commitSeparationTurn(fish, horizontal, vertical) {
  const previous = passingTurns.get(fish);
  if (previous?.contact && fish.swimTime < previous.until) return;
  passingTurns.set(fish, {
    angle: Math.atan2(vertical, horizontal),
    until: fish.swimTime + 3.8,
    contact: true
  });
}

function avoidanceHeading(fish, desired, school) {
  const bounds = swimmingBounds();
  const forwardX = Math.cos(fish.heading);
  const forwardY = Math.sin(fish.heading);
  let threat = null;
  for (const neighbour of school) {
    if (neighbour === fish) continue;
    for (const disc of neighbour.collisionDiscs()) {
      const differenceX = periodicDelta(disc.x - fish.head.x, bounds.right - bounds.left);
      const differenceY = periodicDelta(disc.y - fish.head.y, bounds.bottom - bounds.top);
      const forward = differenceX * forwardX + differenceY * forwardY;
      const sideways = differenceY * forwardX - differenceX * forwardY;
      const clearance = disc.radius + fish.segmentLength * 3;
      if (forward > -fish.segmentLength && forward < fish.segmentLength * 12 && Math.abs(sideways) < clearance) {
        const distance = Math.max(0, forward - disc.radius);
        if (!threat || distance < threat.distance) threat = { neighbour, sideways, distance };
      }
    }
  }
  let passing = passingTurns.get(fish);
  if (passing && fish.swimTime < passing.until) return { angle: passing.angle, active: true };
  if (!threat) {
    passingTurns.delete(fish);
    return { angle: desired, active: false };
  }
  const opposite = Math.cos(threat.neighbour.heading - fish.heading) < -0.3;
  const side = opposite || Math.abs(threat.sideways) < fish.segmentLength ? 1 : -Math.sign(threat.sideways);
  passing = { angle: fish.heading + side * 1.1, until: fish.swimTime + 1.6 };
  passingTurns.set(fish, passing);
  return { angle: passing.angle, active: true };
}