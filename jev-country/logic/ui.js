const tooltip = document.querySelector('#tooltip');
const compactNumber = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 });
let tooltipAnchor = null;
let tooltipTrigger = null;
let tooltipCountry = null;
let tooltipTimer;
document.querySelector('#indexed-count').textContent = `${countries.length} flags indexed`;

function renderStats(container, country) {
	container.replaceChildren();
	for (const metric of [{ key: 'population', label: 'Pop.', indicator: 'SP.POP.TOTL', currency: '' }, { key: 'gdp', label: 'GDP', indicator: 'NY.GDP.MKTP.CD', currency: '$' }]) {
		const value = country[metric.key];
		const year = country[`${metric.key}Year`];
		const link = document.createElement('a');
		link.href = `https://data.worldbank.org/indicator/${metric.indicator}?locations=${country.code.toUpperCase()}`;
		link.target = '_blank'; link.rel = 'noopener noreferrer';
		link.textContent = `${metric.label} ${Number.isFinite(value) ? `${metric.currency}${compactNumber.format(value)} (${year})` : 'Unavailable'}`;
		link.title = `World Bank: ${metric.key === 'gdp' ? 'GDP in current US dollars' : 'total population'}. ${Number.isFinite(value) ? `Observation year: ${year}.` : 'No observation in the snapshot.'}`;
		container.append(link);
	}
}

function positionTooltip() {
	if (tooltip.hidden || !tooltipAnchor) return;
	const anchor = tooltipAnchor();
	const width = tooltip.offsetWidth, height = tooltip.offsetHeight;
	const margin = 12, gap = 18;
	let side = 'right', left = anchor.right + gap, top = anchor.top + anchor.height / 2 - height / 2;
	if (left + width > innerWidth - margin) { side = 'left'; left = anchor.left - gap - width; }
	if (left < margin) {
		const badgeTop = tooltipTrigger?.querySelector('.match-score')?.getBoundingClientRect().top;
		const anchorTop = Math.min(anchor.top, badgeTop ?? anchor.top);
		side = anchorTop - gap - height >= margin ? 'top' : 'bottom';
		left = anchor.left + anchor.width / 2 - width / 2;
		top = side === 'top' ? anchorTop - gap - height : anchor.bottom + gap;
	}
	left = Math.max(margin, Math.min(left, innerWidth - width - margin));
	top = Math.max(margin, Math.min(top, innerHeight - height - margin));
	const arrow = side === 'left' || side === 'right'
		? Math.max(16, Math.min(height - 22, anchor.top + anchor.height / 2 - top - 5))
		: Math.max(16, Math.min(width - 22, anchor.left + anchor.width / 2 - left - 5));
	tooltip.dataset.side = side;
	tooltip.style.setProperty('--arrow-offset', `${arrow}px`);
	tooltip.style.left = `${left}px`; tooltip.style.top = `${top}px`;
}

function showCountryTooltip(country, anchor, trigger = null) {
	clearTimeout(tooltipTimer); tooltipTimer = null;
	if (tooltipTrigger !== trigger) tooltipTrigger?.removeAttribute('aria-describedby');
	tooltipAnchor = anchor; tooltipTrigger = trigger;
	if (tooltipCountry !== country) {
		tooltipCountry = country;
		document.querySelector('#tooltip-name').textContent = country.name;
		document.querySelector('#tooltip-description').textContent = country.description;
		renderStats(document.querySelector('#tooltip-stats'), country);
	}
	trigger?.setAttribute('aria-describedby', 'tooltip');
	tooltip.hidden = false;
	positionTooltip();
}

function hideCountryTooltip(immediate = false) {
	clearTimeout(tooltipTimer); tooltipTimer = null;
	if (!immediate && (tooltipTrigger === document.activeElement || tooltip.contains(document.activeElement))) return;
	const hide = () => {
		tooltipTimer = null;
		tooltip.hidden = true; tooltipCountry = null; tooltipAnchor = null;
		tooltipTrigger?.removeAttribute('aria-describedby'); tooltipTrigger = null;
	};
	if (immediate) hide(); else tooltipTimer = setTimeout(hide, 140);
}

tooltip.addEventListener('pointerenter', () => { clearTimeout(tooltipTimer); tooltipTimer = null; });
tooltip.addEventListener('pointerleave', () => hideCountryTooltip());
tooltip.addEventListener('focusin', () => { clearTimeout(tooltipTimer); tooltipTimer = null; });
tooltip.addEventListener('focusout', event => { if (!tooltip.contains(event.relatedTarget)) hideCountryTooltip(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') hideCountryTooltip(true); });

function openCountry(country) {
	hideCountryTooltip(true);
	document.querySelector('#detail-name').textContent = country.name;
	document.querySelector('#detail-flag').src = `https://flagcdn.com/w160/${country.code}.png`;
	document.querySelector('#detail-flag').alt = `Flag of ${country.name}`;
	document.querySelector('#detail-fact').textContent = country.description;
	renderStats(document.querySelector('#detail-stats'), country);
	document.querySelector('#country-detail').showModal();
}