const fishSpecies = {
  clownfish: {
    name: 'Clownfish', size: 0.85, spacing: 16, speed: 76, flexibility: 9,
    radii: [20, 27, 32, 34, 34, 31, 27, 22, 16, 11, 8, 6],
    palette: { body: '#f5780b', outline: '#382c28', fin: '#f2a344', finOutline: '#382c28', dorsal: '#ed952c' },
    pairs: [[2, 35, 19, 'round'], [6, 24, 11, 'point']],
    median: [[2, 8, 12], [7, 10, -10]], tail: ['round', 34, 23], pattern: 'clown'
  },
  koi: {
    name: 'Koi', size: 1.05, spacing: 23, speed: 80, flexibility: 10,
    radii: [22, 29, 34, 36, 35, 31, 26, 21, 16, 12, 9, 7],
    palette: { body: '#f6eee2', outline: '#655e55', fin: '#e7e3d8', finOutline: '#8a8981', dorsal: '#d6d8d0' },
    pairs: [[2, 49, 26, 'round'], [7, 29, 15, 'point']],
    median: [[3, 8, 13], [8, 10, -10]], tail: ['fork', 48, 30], pattern: 'koi', barbels: true
  },
  betta: {
    name: 'Betta', size: 0.8, spacing: 15, speed: 62, flexibility: 8,
    radii: [15, 21, 25, 26, 24, 22, 19, 15, 12, 9, 7, 5],
    palette: { body: '#166d8c', outline: '#244159', fin: '#d94870', finOutline: '#833751', dorsal: '#498fb6' },
    pairs: [[2, 26, 16, 'round'], [4, 50, 6, 'ribbon']],
    median: [[3, 9, 40], [4, 11, -46]], tail: ['veil', 79, 62], pattern: 'betta'
  },
  guppy: {
    name: 'Guppy', size: 0.68, spacing: 13, speed: 104, flexibility: 10,
    radii: [12, 17, 20, 21, 20, 17, 14, 11, 9, 7, 6, 4],
    palette: { body: '#69b8a5', outline: '#38534f', fin: '#efb740', finOutline: '#977135', dorsal: '#e2a634' },
    pairs: [[2, 21, 12, 'round'], [5, 17, 8, 'point']],
    median: [[4, 8, 26], [6, 9, -7]], tail: ['fan', 67, 49], pattern: 'guppy'
  },
  neonTetra: {
    name: 'Neon tetra', size: 0.65, spacing: 16, speed: 115, flexibility: 10,
    radii: [11, 14, 16, 17, 17, 16, 14, 12, 9, 7, 5, 4],
    palette: { body: '#527b94', outline: '#35465c', fin: '#c3dadd', finOutline: '#819da7', dorsal: '#aecbd2' },
    pairs: [[2, 21, 10, 'point'], [6, 18, 8, 'point']],
    median: [[4, 7, 19], [8, 9, 5], [6, 10, -15]], tail: ['fork', 30, 20], pattern: 'neon'
  },
  discus: {
    name: 'Discus', size: 0.88, spacing: 12, speed: 58, flexibility: 5,
    radii: [16, 31, 44, 52, 56, 55, 49, 39, 27, 15, 8, 5],
    palette: { body: '#d07d40', outline: '#714528', fin: '#aecaaf', finOutline: '#6b8979', dorsal: '#4ba99b' },
    pairs: [[2, 29, 17, 'round'], [4, 40, 5, 'ribbon']],
    median: [[1, 10, 18], [2, 10, -18]], tail: ['round', 29, 20], pattern: 'discus'
  },
  emperorAngelfish: {
    name: 'Emperor angel', size: 0.93, spacing: 15, speed: 73, flexibility: 6,
    radii: [18, 29, 39, 45, 48, 46, 41, 34, 26, 16, 9, 6],
    palette: { body: '#204e9a', outline: '#203660', fin: '#f2d450', finOutline: '#9c8741', dorsal: '#3876b6' },
    pairs: [[2, 34, 19, 'round'], [5, 37, 10, 'point']],
    median: [[2, 10, 25], [4, 10, -24]], tail: ['round', 35, 27], pattern: 'emperor'
  },
  mandarin: {
    name: 'Mandarin', size: 0.8, spacing: 16, speed: 62, flexibility: 9,
    radii: [22, 28, 31, 30, 27, 23, 19, 15, 11, 8, 6, 4],
    palette: { body: '#dc8a30', outline: '#3c5750', fin: '#58b8a4', finOutline: '#2b706e', dorsal: '#359bab' },
    pairs: [[2, 49, 35, 'round'], [5, 29, 20, 'round']],
    median: [[2, 4, 27], [5, 9, 20], [6, 10, -13]], tail: ['round', 39, 23], pattern: 'mandarin'
  },
  rainbowParrotfish: {
    name: 'Rainbow parrot', size: 1, spacing: 21, speed: 78, flexibility: 8,
    radii: [25, 32, 39, 42, 42, 39, 35, 29, 22, 15, 10, 7],
    palette: { body: '#36a998', outline: '#285d65', fin: '#6ac7cb', finOutline: '#397d8d', dorsal: '#4a9cbb' },
    pairs: [[2, 45, 24, 'round'], [6, 29, 15, 'point']],
    median: [[2, 9, 17], [6, 10, -14]], tail: ['crescent', 50, 36], pattern: 'parrot', beak: true
  },
  powderBlueTang: {
    name: 'Powder blue tang', size: 0.9, spacing: 15, speed: 93, flexibility: 6,
    radii: [18, 27, 37, 44, 47, 46, 40, 32, 24, 15, 8, 5],
    palette: { body: '#76bce4', outline: '#345b83', fin: '#f1dc7b', finOutline: '#9a8957', dorsal: '#efcf37' },
    pairs: [[2, 31, 19, 'round'], [5, 26, 13, 'point']],
    median: [[1, 10, 20], [3, 10, -16]], tail: ['crescent', 34, 25], pattern: 'tang'
  }
};

function speciesFinGeometry(species, sample, scaleFactor, curvature, time) {
  const shapes = [];
  for (const [segment, length, breadth, shape] of species.pairs) {
    for (const side of [-1, 1]) {
      const anchor = sample(segment, side * 0.82);
      const front = sample(Math.max(0, segment - 1), 0);
      const angle = front.angle - side * (0.65 + Math.sin(time * 3.5 + segment) * 0.07);
      const transform = (back, lateral) => ({
        x: anchor.x - Math.cos(angle) * back * scaleFactor - Math.sin(angle) * side * lateral * scaleFactor,
        y: anchor.y - Math.sin(angle) * back * scaleFactor + Math.cos(angle) * side * lateral * scaleFactor
      });
      const profile = shape === 'round' ? [[-4, 0], [length * 0.15, breadth], [length * 0.7, breadth], [length, 0], [length * 0.4, -breadth * 0.2]]
        : shape === 'ribbon' ? [[0, 0], [length * 0.4, breadth], [length, breadth * 0.4], [length * 0.65, -breadth * 0.3]]
          : [[-3, 0], [length * 0.4, breadth], [length, breadth * 0.25], [length * 0.3, -breadth * 0.2]];
      shapes.push({ segment, points: profile.map(([back, lateral]) => transform(back, lateral)), fill: species.palette.fin });
    }
  }
  for (const [start, end, extension] of species.median) {
    const side = Math.sign(extension);
    const inner = [];
    const outer = [];
    for (let step = 0; step <= 12; step++) {
      const progress = step / 12;
      const segment = start + (end - start) * progress;
      inner.push(sample(segment, side * 0.8));
      const point = sample(segment, side * 0.93);
      const flex = 1 + Math.tanh(curvature) * side * 0.18;
      const height = Math.sin(progress * Math.PI) * extension * scaleFactor * flex;
      outer.push({ x: point.x - Math.sin(point.angle) * height, y: point.y + Math.cos(point.angle) * height });
    }
    shapes.push({ segment: (start + end) / 2, points: [...inner, ...outer.reverse()], fill: side > 0 ? species.palette.dorsal : species.palette.fin });
  }
  const [type, length, breadth] = species.tail;
  const root = sample(11, 0);
  const spread = 0.4 + Math.tanh(Math.abs(curvature)) * 0.6;
  const bend = Math.tanh(curvature * 0.6) * 0.16 + Math.sin(time * 4) * 0.035;
  const tailPoint = (back, lateral) => ({
    x: root.x - Math.cos(root.angle) * back * scaleFactor - Math.sin(root.angle) * (lateral * spread + bend * back) * scaleFactor,
    y: root.y - Math.sin(root.angle) * back * scaleFactor + Math.cos(root.angle) * (lateral * spread + bend * back) * scaleFactor
  });
  let tail;
  if (type === 'fork' || type === 'crescent') {
    tail = [[0, 4], [length * 0.55, breadth * 0.6], [length, breadth], [length * (type === 'crescent' ? 0.48 : 0.58), 0], [length, -breadth], [length * 0.55, -breadth * 0.6], [0, -4]];
  } else {
    tail = [[0, 4], [length * 0.5, breadth * 0.7]];
    for (let step = 0; step <= 12; step++) {
      const angle = -Math.PI / 2 + step * Math.PI / 12;
      const ruffle = type === 'veil' ? 1 + 0.06 * Math.cos(step * Math.PI + time * 2) : 1;
      tail.push([length * (type === 'fan' ? 0.92 : 0.72 + 0.28 * Math.cos(angle)) * ruffle, -Math.sin(angle) * breadth]);
    }
    tail.push([length * 0.5, -breadth * 0.7], [0, -4]);
  }
  shapes.push({ segment: 11, points: tail.map(([back, lateral]) => tailPoint(back, lateral)), fill: species.palette.fin });
  return shapes;
}

function clownfishGradient(sample) {
  const upper = sample(3, -1.5);
  const lower = sample(6, 1.5);
  const gradient = drawingContext.createLinearGradient(upper.x, upper.y, lower.x, lower.y);
  gradient.addColorStop(0, '#d95b07');
  gradient.addColorStop(0.35, '#f5780b');
  gradient.addColorStop(0.7, '#ff9713');
  gradient.addColorStop(1, '#e96805');
  return gradient;
}

function createSpeciesPattern(species, variation) {
  const patterns = [];
  const sample = (segment, lateral) => ({ segment, lateral });
  const strip = (start, end, center, thickness, color, wave = 0) => {
    const upper = [];
    const lower = [];
    for (let step = 0; step <= 48; step++) {
      const segment = start + (end - start) * step / 48;
      const offset = center + Math.sin(segment * 1.4 + variation) * wave;
      upper.push(sample(segment, offset + thickness / 2));
      lower.push(sample(segment, offset - thickness / 2));
    }
    patterns.push({ color, points: [...upper, ...lower.reverse()] });
  };
  const band = (segment, thickness, color) => strip(segment - thickness / 2, segment + thickness / 2, 0, 2.7, color);
  const patch = (segment, lateral, length, breadth, color, phase = 0) => {
    const points = [];
    for (let step = 0; step < 24; step++) {
      const angle = step * Math.PI / 12;
      const irregular = 1 + Math.sin(angle * 3 + phase) * 0.14;
      points.push(sample(segment + Math.cos(angle) * length * irregular, lateral + Math.sin(angle) * breadth * irregular));
    }
    patterns.push({ color, points });
  };
  switch (species.pattern) {
    case 'clown':
      for (const segment of [1.2, 5.2, 9.2]) { band(segment, 1.05, '#272c30'); band(segment, 0.72, '#fff9e8'); }
      break;
    case 'koi':
      for (let index = 0; index < 6; index++) {
        patch(0.8 + index * 1.8, Math.sin(index * 2.3 + variation) * 0.45, index === 0 ? 0.8 : 1.1, 0.7, index % 3 === 2 ? '#303339' : '#dc5135', index + variation);
      }
      break;
    case 'betta':
      strip(1, 10.7, 0, 0.65, '#298eaa', 0.08);
      for (let index = 0; index < 18; index++) patch(1 + index * 0.5, Math.sin(index * 2.4) * 0.6, 0.22, 0.15, index % 3 ? '#74c5c6' : '#e76683');
      break;
    case 'guppy':
      strip(0, 11, -0.2, 0.5, '#8cbecc');
      for (let index = 0; index < 9; index++) {
        patch(2 + index * 0.9, Math.sin(index * 2 + variation) * 0.6, 0.42, 0.37, '#e79e35');
        patch(2 + index * 0.9, Math.sin(index * 2 + variation) * 0.6, 0.23, 0.2, '#304f6c');
      }
      break;
    case 'neon':
      strip(4.8, 11.5, 0.3, 1.1, '#e94355');
      strip(-0.5, 10.6, -0.32, 0.38, '#124bd1');
      strip(-0.5, 10.6, -0.32, 0.16, '#68f4f1');
      break;
    case 'discus':
      for (let segment = 1; segment < 10; segment += 1.1) band(segment, 0.22, '#723f3f80');
      for (let lateral = -0.8; lateral <= 0.8; lateral += 0.27) strip(0, 10.8, lateral, 0.085, '#7fdfc4', 0.1);
      break;
    case 'emperor':
      for (let lateral = -0.9; lateral <= 0.91; lateral += 0.23) strip(1.5, 11, lateral, 0.09, '#f8da55', 0.045);
      band(0.45, 1.35, '#152b47');
      band(1.25, 0.22, '#b5e8ef');
      break;
    case 'mandarin':
      for (let lateral = -0.8; lateral <= 0.81; lateral += 0.4) {
        strip(-0.4, 11, lateral, 0.26, '#23635a', 0.16);
        strip(-0.4, 11, lateral, 0.11, '#54dce0', 0.16);
      }
      for (let index = 0; index < 8; index++) {
        patch(0.4 + index * 1.3, Math.cos(index * 2.7) * 0.55, 0.35, 0.25, '#215462');
        patch(0.4 + index * 1.3, Math.cos(index * 2.7) * 0.55, 0.2, 0.12, '#71d5a7');
      }
      break;
    case 'parrot':
      for (let segment = 1.7; segment < 10.5; segment += 0.65) {
        for (let row = 0; row < 5; row++) {
          patch(segment + row % 2 * 0.28, (row - 2) * 0.38, 0.33, 0.21, '#467ab1');
          patch(segment + row % 2 * 0.28, (row - 2) * 0.38, 0.24, 0.15, row % 2 ? '#66c590' : '#d195a9');
        }
      }
      strip(-0.5, 2, 0.2, 0.15, '#73e0bc', 0.1);
      break;
    case 'tang':
      strip(-1, 1.8, 0, 3, '#243647');
      band(1.8, 0.55, '#f7f1d5');
      band(10, 0.7, '#f3d342');
      break;
  }
  return patterns;
}