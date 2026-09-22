const canvas = document.querySelector('#flag-canvas');
const context = canvas.getContext('2d');
const app = document.querySelector('.app');
const resultsGlass = document.querySelector('#results-glass');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FLIGHT_DURATION_MS = 800;
const SCALE_DURATION_MS = FLIGHT_DURATION_MS * 0.1;
const ROTATION_DURATION_MS = FLIGHT_DURATION_MS * 1.5;
const RECYCLE_INTERVAL_MS = 500;
const RESULTS_FADE_MS = 220;
const RESULT_SIZE_MULTIPLIER = 1.5;
let resultsFadeTimer;
let paused = false;
let worldWidth = 0, worldHeight = 0, flagWidth = 0, flagHeight = 0;
let bodies = [], walls = [], pointerBody = null, dragConstraint = null;
let pointerStart = null;
const images = new Map();
countries.forEach(country => { const image = new Image(); image.crossOrigin = 'anonymous'; image.src = `https://flagcdn.com/w160/${country.code}.png`; images.set(country.code, image); });
const physics = globalThis.Matter;
const engine = physics ? physics.Engine.create({ enableSleeping: true, gravity: { x: 0, y: 1 } }) : null;
function rebuildWorld() {
	const rect = app.getBoundingClientRect();
	if (worldWidth === rect.width && worldHeight === rect.height) return;
	if (rect.width <= 0 || rect.height <= 0) return;
	const previousWidth = worldWidth, previousHeight = worldHeight;
	worldWidth = rect.width; worldHeight = rect.height;
	const ratio = Math.min(devicePixelRatio || 1, 2);
	canvas.width = worldWidth * ratio; canvas.height = worldHeight * ratio;
	context.setTransform(ratio, 0, 0, ratio, 0, 0);
	if (bodies.length) {
		resizeWorld(previousWidth, previousHeight);
		return;
	}
	const mobile = worldWidth < 600;
	flagWidth = mobile ? 18 : 36; flagHeight = mobile ? 14 : 28;
	bodies = Array.from({ length: countries.length }, (_, index) => {
		const country = countries[(index * 73) % countries.length];
		const position = { x: flagWidth + Math.random() * (worldWidth - flagWidth * 2), y: -flagHeight - Math.random() * worldHeight * 1.8 };
		const body = engine ? physics.Bodies.rectangle(position.x, position.y, flagWidth, flagHeight, { chamfer: { radius: 3 }, restitution: .62, friction: .45, frictionAir: .008, angle: Math.random() * Math.PI * 2 }) : { position: { x: position.x, y: worldHeight - 15 - Math.random() * 110 }, angle: Math.random() * Math.PI };
		body.country = country;
		body.visualScale = 1;
		if (engine) { physics.Body.setVelocity(body, { x: (Math.random() - .5) * 4, y: Math.random() * 2 }); physics.Body.setAngularVelocity(body, (Math.random() - .5) * .12); }
		return body;
	});
	if (engine) {
		walls = [physics.Bodies.rectangle(worldWidth / 2, worldHeight + 28, worldWidth + 160, 60, { isStatic: true }), physics.Bodies.rectangle(-30, -worldHeight, 60, worldHeight * 6, { isStatic: true }), physics.Bodies.rectangle(worldWidth + 30, -worldHeight, 60, worldHeight * 6, { isStatic: true })];
		physics.Composite.add(engine.world, [...walls, ...bodies]);
		if (paused) for (let step = 0; step < 600; step++) physics.Engine.update(engine, 1000 / 60);
	}
	updateFlagTargets(lastAnswer?.countries || []);
}
function getResultTargets(count) {
	if (!count) { searchArea.style.marginTop = ''; return []; }
	const searchRect = document.querySelector('.search-box').getBoundingClientRect();
	const baseSpacing = Math.min(78, (searchRect.width - 12) / Math.max(count, 1));
	const width = Math.min(54, baseSpacing - 12) * RESULT_SIZE_MULTIPLIER;
	const spacing = baseSpacing * RESULT_SIZE_MULTIPLIER;
	const columns = Math.max(1, Math.min(count, Math.floor((worldWidth - 68 - width) / spacing) + 1));
	const rows = Math.ceil(count / columns);
	const rowHeight = flagHeight * width / flagWidth + 50;
	const searchTop = searchRect.top - (Number.parseFloat(searchArea.style.marginTop) || 0);
	const offset = Math.max(0, 72 + 62 + flagHeight * width / flagWidth / 2 + 46 + (rows - 1) * rowHeight - searchTop);
	searchArea.style.marginTop = `${offset}px`;
	return Array.from({ length: count }, (_, index) => {
		const row = Math.floor(index / columns);
		const columnsInRow = Math.min(columns, count - row * columns);
		return {
			position: { x: worldWidth / 2 + (index % columns - (columnsInRow - 1) / 2) * spacing, y: searchTop + offset - 62 - (rows - row - 1) * rowHeight },
			scale: width / flagWidth
		};
	});
}
function resizeWorld(previousWidth, previousHeight) {
	if (engine) {
		physics.Body.scale(walls[0], (worldWidth + 160) / (previousWidth + 160), 1);
		physics.Body.setPosition(walls[0], { x: worldWidth / 2, y: worldHeight + 28 });
		for (const wall of walls.slice(1)) physics.Body.scale(wall, 1, worldHeight / previousHeight);
		physics.Body.setPosition(walls[1], { x: -30, y: -worldHeight });
		physics.Body.setPosition(walls[2], { x: worldWidth + 30, y: -worldHeight });
	}
	const resultButtons = [...results.children];
	const targets = getResultTargets(resultButtons.length);
	for (const body of bodies) {
		const halfWidth = (Math.abs(Math.cos(body.angle)) * flagWidth + Math.abs(Math.sin(body.angle)) * flagHeight) / 2;
		const halfHeight = (Math.abs(Math.sin(body.angle)) * flagWidth + Math.abs(Math.cos(body.angle)) * flagHeight) / 2;
		const resizePosition = position => ({
			x: Math.max(halfWidth, Math.min(worldWidth - halfWidth, position.x * worldWidth / previousWidth)),
			y: Math.min(worldHeight - 2 - halfHeight, position.y + worldHeight - previousHeight)
		});
		const position = resizePosition(body.position);
		if (engine) {
			physics.Body.setPosition(body, position);
			if (!body.target) physics.Sleeping.set(body, false);
		} else body.position = position;
		if (body.returnPosition) body.returnPosition = resizePosition(body.returnPosition);
		if (!body.target) continue;
		body.flight.position = resizePosition(body.flight.position);
		const index = resultButtons.indexOf(body.resultButton);
		Object.assign(body.target, targets[index].position);
		body.targetScale = targets[index].scale;
	}
	if (engine && paused && worldWidth < previousWidth) {
		const velocities = bodies.map(body => ({ velocity: { ...body.velocity }, angularVelocity: body.angularVelocity }));
		const gravityScale = engine.gravity.scale;
		engine.gravity.scale = 0;
		for (const body of bodies) {
			if (body.target) continue;
			physics.Body.setVelocity(body, { x: 0, y: 0 });
			physics.Body.setAngularVelocity(body, 0);
		}
		for (let step = 0; step < 90; step++) physics.Engine.update(engine, 1000 / 60);
		engine.gravity.scale = gravityScale;
		bodies.forEach((body, index) => {
			if (body.target) return;
			physics.Body.setVelocity(body, velocities[index].velocity);
			physics.Body.setAngularVelocity(body, velocities[index].angularVelocity);
		});
	}
	positionResultsGlass();
	animateFlags(0);
	drawWorld();
}
function positionResultsGlass() {
	const selected = bodies.filter(body => body.target);
	if (!selected.length) return;
	const left = Math.min(...selected.map(body => body.target.x - flagWidth * body.targetScale / 2)) - 16;
	const right = Math.max(...selected.map(body => body.target.x + flagWidth * body.targetScale / 2)) + 16;
	const top = Math.min(...selected.map(body => body.target.y - flagHeight * body.targetScale / 2)) - 46;
	const bottom = Math.max(...selected.map(body => body.target.y + flagHeight * body.targetScale / 2)) + 16;
	Object.assign(resultsGlass.style, { left: `${left}px`, top: `${top}px`, width: `${right - left}px`, height: `${bottom - top}px` });
}
function updateFlagTargets(matches, immediate = false) {
	clearTimeout(resultsFadeTimer);
	hideCountryTooltip(true);
	const visible = matches.length > 0;
	resultsGlass.classList.remove('is-visible');
	results.classList.toggle('is-visible', visible);
	results.inert = !visible;
	if (!visible && results.childElementCount && !immediate && !reducedMotion) {
		resultsFadeTimer = setTimeout(() => updateFlagTargets([], true), RESULTS_FADE_MS);
		return;
	}
	const nextCodes = new Set(matches.map(country => country.code));
	for (const body of bodies) {
		if (!body.target || nextCodes.has(body.country.code)) continue;
		body.target = null; body.flight = null; body.resultButton = null;
		startScaleTransition(body, 1);
		if (engine) {
			physics.Body.setStatic(body, false); body.collisionFilter.mask = 0xFFFFFFFF;
			physics.Sleeping.set(body, false);
			physics.Body.setVelocity(body, { x: (Math.random() - .5) * 3, y: 0 });
			physics.Body.setAngularVelocity(body, (Math.random() - .5) * .12);
		}
		if (paused || !engine) {
			const position = body.returnPosition || { x: worldWidth / 2, y: worldHeight - flagHeight };
			if (engine) physics.Body.setPosition(body, position); else body.position = position;
		}
	}
	results.replaceChildren();
	const targets = getResultTargets(matches.length);
	matches.forEach((country, index) => {
		const body = bodies.find(item => item.country.code === country.code);
		if (!body) return;
		if (!body.target) body.returnPosition = { x: body.position.x, y: Math.max(worldHeight - 80, body.position.y) };
		body.target = targets[index].position;
		body.targetScale = targets[index].scale;
		body.flight = { position: { ...body.position }, angle: body.angle, scale: body.visualScale, elapsed: 0 };
		body.scaleTransition = null;
		if (engine) { physics.Body.setStatic(body, true); body.collisionFilter.mask = 0; }
		const button = document.createElement('button');
		button.className = 'flag-result'; button.dataset.name = country.name;
		const providerName = country.provider === 'openjev' ? 'OpenJev' : 'Jev';
		button.setAttribute('aria-label', `${country.name}, ${country.score}% ${country.mock ? 'mock match' : `${providerName} match probability`}`);
		const image = document.createElement('img');
		image.src = images.get(country.code).src; image.alt = ''; image.draggable = false;
		const badge = document.createElement('span');
		badge.className = 'match-score'; badge.textContent = `${country.score}%`;
		badge.title = country.mock ? 'Mock relevance score; not a measured confidence level' : `${providerName}-estimated probability of matching your query; not a verified fact`;
		button.append(image, badge);
		button.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') showCountryTooltip(country, () => getFlagRect(body), button); });
		button.addEventListener('pointerleave', () => hideCountryTooltip());
		button.addEventListener('focus', () => showCountryTooltip(country, () => getFlagRect(body), button));
		button.addEventListener('blur', () => hideCountryTooltip());
		button.addEventListener('click', () => openCountry(country));
		body.resultButton = button; results.append(button);
	});
	positionResultsGlass();
}
function startScaleTransition(body, scale) {
	body.scaleTransition = { from: body.visualScale, to: scale, elapsed: 0 };
}
function sharpEaseInOut(progress) {
	if (progress <= 0 || progress >= 1) return progress;
	return progress < .5 ? Math.pow(2, 20 * progress - 10) / 2 : (2 - Math.pow(2, -20 * progress + 10)) / 2;
}
function getFlagRect(body) {
	const width = flagWidth * body.visualScale, height = flagHeight * body.visualScale;
	return { left: body.position.x - width / 2, right: body.position.x + width / 2, top: body.position.y - height / 2, bottom: body.position.y + height / 2, width, height };
}
function animateFlags(delta) {
	let resultsPlaced = results.childElementCount > 0;
	for (const body of bodies) {
		if (body.scaleTransition) {
			const transition = body.scaleTransition;
			transition.elapsed += delta;
			const progress = paused ? 1 : Math.min(transition.elapsed / SCALE_DURATION_MS, 1);
			body.visualScale = transition.from + (transition.to - transition.from) * sharpEaseInOut(progress);
			if (progress === 1) body.scaleTransition = null;
		}
		if (!body.target) continue;
		const flight = body.flight;
		flight.elapsed += delta;
		const progress = paused ? 1 : Math.min(flight.elapsed / FLIGHT_DURATION_MS, 1);
		const rotationProgress = paused ? 1 : Math.min(flight.elapsed / ROTATION_DURATION_MS, 1);
		if (rotationProgress < 1) resultsPlaced = false;
		const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
		const position = { x: flight.position.x + (body.target.x - flight.position.x) * eased, y: flight.position.y + (body.target.y - flight.position.y) * eased };
		const rotationEased = sharpEaseInOut(rotationProgress);
		body.visualScale = flight.scale + (body.targetScale - flight.scale) * eased;
		const angle = flight.angle + Math.atan2(-Math.sin(flight.angle), Math.cos(flight.angle)) * rotationEased;
		if (engine) { physics.Body.setPosition(body, position); physics.Body.setAngle(body, angle); }
		else { body.position = position; body.angle = angle; }
		const rect = getFlagRect(body);
		Object.assign(body.resultButton.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
		body.resultButton.style.setProperty('--flag-angle', `${body.angle}rad`);
	}
	if (resultsPlaced && results.classList.contains('is-visible')) resultsGlass.classList.add('is-visible');
	positionTooltip();
}
function drawWorld() {
	context.clearRect(0, 0, worldWidth, worldHeight);
	for (const body of bodies) {
		if (body.target) continue;
		context.save();
		context.translate(body.position.x, body.position.y); context.rotate(body.angle);
		context.scale(body.visualScale, body.visualScale);
		const image = images.get(body.country.code);
		if (image.complete && image.naturalWidth) {
			const fit = Math.min(flagWidth / image.naturalWidth, flagHeight / image.naturalHeight);
			const width = image.naturalWidth * fit, height = image.naturalHeight * fit;
			context.drawImage(image, -width / 2, -height / 2, width, height);
		}
		else { context.fillStyle = '#252a20'; context.font = '10px sans-serif'; context.textAlign = 'center'; context.fillText(body.country.code.toUpperCase(), 0, 4); }
		context.restore();
	}
}
function setPaused(value) {
	paused = value;
	document.querySelector('#motion').checked = !paused;
}
document.querySelector('#motion').addEventListener('change', event => setPaused(!event.target.checked));
document.querySelector('#gravity').addEventListener('input', event => { if (engine) { engine.gravity.y = Number(event.target.value); bodies.forEach(body => physics.Sleeping.set(body, false)); } });
document.querySelector('#shuffle').addEventListener('click', () => {
	if (!engine) return;
	setPaused(false);
	bodies.filter(body => !body.target).forEach(body => { physics.Sleeping.set(body, false); physics.Body.setVelocity(body, { x: (Math.random() - .5) * 9, y: -5 - Math.random() * 11 }); physics.Body.setAngularVelocity(body, (Math.random() - .5) * .18); });
});
function recycleFlag() {
	if (!engine || paused || document.hidden || document.querySelector('#country-detail[open]')) return false;
	const settled = bodies.filter(body => !body.target && body !== pointerBody && body.country.code !== tooltipCountry?.code && body.position.y > worldHeight * .7 && body.speed < 1.5 && Math.abs(body.angularVelocity) < .05);
	if (!settled.length) return false;
	const body = settled[Math.floor(Math.random() * settled.length)];
	physics.Sleeping.set(body, false);
	physics.Body.setPosition(body, { x: flagWidth + Math.random() * Math.max(1, worldWidth - flagWidth * 2), y: -flagHeight * 2 });
	physics.Body.setVelocity(body, { x: (Math.random() - .5) * 2, y: 0 });
	physics.Body.setAngle(body, Math.random() * Math.PI * 2);
	physics.Body.setAngularVelocity(body, (Math.random() - .5) * .1);
	return true;
}
setInterval(recycleFlag, RECYCLE_INTERVAL_MS);
function pointerPosition(event) { const rect = canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; }
function findBody(position) {
	const looseFlags = bodies.filter(body => !body.target);
	if (engine) return physics.Query.point(looseFlags, position).at(-1);
	return looseFlags.find(body => Math.abs(body.position.x - position.x) < flagWidth / 2 && Math.abs(body.position.y - position.y) < flagHeight / 2);
}
canvas.addEventListener('pointerdown', event => {
	const position = pointerPosition(event); pointerBody = findBody(position); pointerStart = position;
	if (!pointerBody) return;
	hideCountryTooltip(true); canvas.setPointerCapture(event.pointerId);
	if (engine && !paused) { physics.Sleeping.set(pointerBody, false); dragConstraint = physics.Constraint.create({ pointA: position, bodyB: pointerBody, stiffness: .12, length: 0 }); physics.Composite.add(engine.world, dragConstraint); }
});
canvas.addEventListener('pointermove', event => {
	const position = pointerPosition(event);
	if (dragConstraint) { dragConstraint.pointA = position; return; }
	const hovered = findBody(position);
	canvas.style.cursor = hovered ? 'grab' : 'default';
	if (!tooltip.hidden && !tooltipTimer) hideCountryTooltip();
});
function releasePointer(event) {
	if (dragConstraint) { physics.Composite.remove(engine.world, dragConstraint); dragConstraint = null; }
	if (pointerBody && pointerStart && event.type === 'pointerup') {
		const position = pointerPosition(event);
		if (Math.hypot(position.x - pointerStart.x, position.y - pointerStart.y) < 7) openCountry(pointerBody.country);
	}
	pointerBody = null; pointerStart = null;
}
canvas.addEventListener('pointerup', releasePointer);
canvas.addEventListener('pointercancel', releasePointer);
canvas.addEventListener('pointerleave', () => hideCountryTooltip());
let previousTime = 0;
function animate(time) {
	const delta = Math.min(time - previousTime || 1000 / 60, 100); previousTime = time;
	if (engine && !paused && !document.hidden) physics.Engine.update(engine, Math.min(delta, 1000 / 60));
	animateFlags(delta);
	drawWorld(); requestAnimationFrame(animate);
}
new ResizeObserver(rebuildWorld).observe(app);
rebuildWorld(); setPaused(paused); requestAnimationFrame(animate);
