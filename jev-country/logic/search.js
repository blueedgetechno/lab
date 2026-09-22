const queryInput = document.querySelector('#query');
const searchArea = document.querySelector('.search-area');
const results = document.querySelector('#flag-results');
const processing = document.querySelector('#processing');
const status = document.querySelector('#search-status');
const emptyState = document.querySelector('#empty-state');
const mockToggle = document.querySelector('#mock-search');
const openJevToggle = document.querySelector('#use-openjev');
// Change this value to adjust the idle time before automatic search (milliseconds).
const SEARCH_DEBOUNCE_MS = 1000;
let searchTimer;
let selectedCodes = new Set();
let searchVersion = 0;
let lastAnswer = null;
let searchController;
const iconRefresh = () => globalThis.lucide?.createIcons();
const normalize = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
function searchMockCountries(query) {
	const normalized = normalize(query);
	if (!normalized) return { mock: true, countries: [] };
	const topic = mockTopics.find(item => item.pattern.test(normalized));
	if (topic) return { mock: true, label: topic.label, countries: topic.answers.map(([code, fact], index) => ({ ...countries.find(country => country.code === code), mock: true, fact, detail: topic.detail || fact, score: 97 - index * 7 })) };
	const aliases = { usa: 'us', america: 'us', uk: 'gb', england: 'gb', uae: 'ae', korea: 'kr', holland: 'nl' };
	const alias = aliases[normalized];
	const matches = countries.filter(country => country.code === alias || normalize(country.name).includes(normalized) || normalized.includes(normalize(country.name)) || country.code === normalized);
	return { mock: true, countries: matches.slice(0, 6).map((country, index) => ({ ...country, mock: true, fact: country.description, score: 99 - index * 5 })) };
}
async function searchCountries(query, signal) {
	if (mockToggle.checked) return searchMockCountries(query);
	const provider = openJevToggle.checked ? 'openjev' : 'vercel';
	const response = await fetch('/api/jev-country', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query, provider }),
		signal
	});
	if (!response.headers.get('content-type')?.includes('application/json')) {
		throw new Error('Country search is unavailable on this host.');
	}
	const answer = await response.json();
	if (!response.ok) throw new Error(answer.error || 'Could not reach Jev. Try again.');
	if (answer.provider !== provider) throw new Error('Search provider mismatch. Restart the local server and try again.');
	if (!Array.isArray(answer.countries) || answer.countries.length > 6) throw new Error('Invalid country results. Try again.');
	const seen = new Set();
	return { ...answer, mock: false, countries: answer.countries.map(match => {
		const country = countries.find(item => item.code === match?.code);
		if (!country || seen.has(match.code) || !Number.isFinite(match.score) || match.score < 0 || match.score > 100) {
			throw new Error('Invalid country results. Try again.');
		}
		seen.add(match.code);
		return { ...country, provider, score: match.score };
	}) };
}
async function submitSearch(query) {
	clearTimeout(searchTimer);
	if (composing) return;
	const cleanQuery = query.trim();
	if (!cleanQuery) { resetSearch(); return; }
	searchController?.abort();
	const controller = new AbortController();
	searchController = controller;
	queryInput.value = cleanQuery;
	const version = ++searchVersion;
	status.textContent = 'Looking around the world...';
	searchArea.setAttribute('aria-busy', 'true');
	processing.hidden = false;
	emptyState.hidden = true;
	try {
		const answer = await searchCountries(cleanQuery, AbortSignal.any([controller.signal, AbortSignal.timeout(25000)]));
		if (version !== searchVersion) return;
		lastAnswer = answer;
		selectedCodes = new Set(answer.countries.map(country => country.code));
		updateFlagTargets(answer.countries);
		emptyState.textContent = 'No matches. Try another question.';
		emptyState.hidden = answer.countries.length > 0;
		const source = answer.mock ? 'Mock' : answer.provider === 'openjev' ? 'OpenJev' : 'Jev';
		status.textContent = answer.countries.length ? `${source} matches: ${answer.countries.map(country => country.name).join(', ')}` : 'No matching countries.';
	} catch (error) {
		if (version !== searchVersion || controller.signal.aborted) return;
		lastAnswer = null; selectedCodes.clear(); updateFlagTargets([]);
		const message = error.name === 'TimeoutError' ? 'Search timed out. Try again.' : error instanceof TypeError ? 'Could not reach Jev. Check your connection and try again.' : error.message;
		emptyState.textContent = message; emptyState.hidden = false;
		status.textContent = message;
	} finally {
		if (version === searchVersion) {
			searchArea.removeAttribute('aria-busy'); processing.hidden = true;
			searchController = null;
		}
	}
}
function resetSearch() {
	clearTimeout(searchTimer);
	searchController?.abort(); searchController = null;
	searchVersion++; selectedCodes.clear(); lastAnswer = null;
	queryInput.value = ''; updateFlagTargets([]);
	processing.hidden = true; emptyState.hidden = true;
	searchArea.removeAttribute('aria-busy'); status.textContent = '';
}
function scheduleSearch() {
	clearTimeout(searchTimer); searchVersion++;
	searchController?.abort(); searchController = null;
	selectedCodes.clear(); lastAnswer = null; updateFlagTargets([], true);
	processing.hidden = true; searchArea.removeAttribute('aria-busy');
	emptyState.hidden = true; status.textContent = '';
	if (!queryInput.value.trim()) { resetSearch(); return; }
	if (!composing) searchTimer = setTimeout(() => submitSearch(queryInput.value), SEARCH_DEBOUNCE_MS);
}
let composing = false;
function changeSearchSource() {
	openJevToggle.disabled = mockToggle.checked;
	const query = queryInput.value;
	resetSearch();
	queryInput.value = query;
	if (!composing) submitSearch(query);
}
openJevToggle.disabled = mockToggle.checked;
mockToggle.addEventListener('change', changeSearchSource);
openJevToggle.addEventListener('change', changeSearchSource);
document.querySelector('#search-form').addEventListener('submit', event => { event.preventDefault(); submitSearch(queryInput.value); });
document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => submitSearch(button.dataset.query)));
queryInput.addEventListener('input', scheduleSearch);
queryInput.addEventListener('compositionstart', () => { composing = true; scheduleSearch(); });
queryInput.addEventListener('compositionend', () => { composing = false; scheduleSearch(); });
queryInput.addEventListener('keydown', event => { if (event.key === 'Escape') resetSearch(); });
document.querySelector('#settings-button').addEventListener('click', () => document.querySelector('#settings').showModal());
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.close).close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } }));
iconRefresh();

