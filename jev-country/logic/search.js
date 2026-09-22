const queryInput = document.querySelector('#query');
const searchArea = document.querySelector('.search-area');
const results = document.querySelector('#flag-results');
const processing = document.querySelector('#processing');
const status = document.querySelector('#search-status');
// Change this value to adjust the idle time before automatic search (milliseconds).
const SEARCH_DEBOUNCE_MS = 1000;
let searchTimer;
let selectedCodes = new Set();
let searchVersion = 0;
let lastAnswer = null;
const iconRefresh = () => globalThis.lucide?.createIcons();
const normalize = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
async function searchCountries(query) {
	await new Promise(resolve => setTimeout(resolve, 360));
	const normalized = normalize(query);
	if (!normalized) return { countries: [] };
	const topic = mockTopics.find(item => item.pattern.test(normalized));
	if (topic) return { label: topic.label, countries: topic.answers.map(([code, fact], index) => ({ ...countries.find(country => country.code === code), fact, detail: topic.detail || fact, score: 97 - index * 7 })) };
	const aliases = { usa: 'us', america: 'us', uk: 'gb', england: 'gb', uae: 'ae', korea: 'kr', holland: 'nl' };
	const alias = aliases[normalized];
	const matches = countries.filter(country => country.code === alias || normalize(country.name).includes(normalized) || normalized.includes(normalize(country.name)) || country.code === normalized);
	return { label: matches.length ? 'A place for your curiosity.' : 'No countries found for that question.', countries: matches.slice(0, 6).map((country, index) => ({ ...country, fact: country.description, score: 99 - index * 5 })) };
}
async function submitSearch(query) {
	clearTimeout(searchTimer);
	const cleanQuery = query.trim();
	if (!cleanQuery) { resetSearch(); return; }
	queryInput.value = cleanQuery;
	const version = ++searchVersion;
	status.textContent = 'Looking around the world...';
	searchArea.setAttribute('aria-busy', 'true');
	processing.hidden = false;
	const answer = await searchCountries(cleanQuery);
	if (version !== searchVersion) return;
	lastAnswer = answer;
	selectedCodes = new Set(answer.countries.map(country => country.code));
	updateFlagTargets(answer.countries);
	document.querySelector('#empty-state').hidden = answer.countries.length > 0;
	searchArea.removeAttribute('aria-busy');
	processing.hidden = true;
	status.textContent = answer.countries.length ? `Mock matches: ${answer.countries.map(country => country.name).join(', ')}` : 'No matching countries.';
}
function resetSearch() {
	clearTimeout(searchTimer);
	searchVersion++; selectedCodes.clear(); lastAnswer = null;
	queryInput.value = ''; updateFlagTargets([]);
	processing.hidden = true; document.querySelector('#empty-state').hidden = true;
	searchArea.removeAttribute('aria-busy'); status.textContent = '';
}
function scheduleSearch() {
	clearTimeout(searchTimer); searchVersion++;
	processing.hidden = true; searchArea.removeAttribute('aria-busy');
	document.querySelector('#empty-state').hidden = true;
	if (!queryInput.value.trim()) { resetSearch(); return; }
	if (!composing) searchTimer = setTimeout(() => submitSearch(queryInput.value), SEARCH_DEBOUNCE_MS);
}
let composing = false;
document.querySelector('#search-form').addEventListener('submit', event => { event.preventDefault(); submitSearch(queryInput.value); });
document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => submitSearch(button.dataset.query)));
queryInput.addEventListener('input', scheduleSearch);
queryInput.addEventListener('compositionstart', () => { composing = true; clearTimeout(searchTimer); searchVersion++; });
queryInput.addEventListener('compositionend', () => { composing = false; scheduleSearch(); });
queryInput.addEventListener('keydown', event => { if (event.key === 'Escape') resetSearch(); });
document.querySelector('#settings-button').addEventListener('click', () => document.querySelector('#settings').showModal());
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.close).close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } }));
iconRefresh();

