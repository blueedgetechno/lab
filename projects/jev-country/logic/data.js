const countryCodes = 'af al dz ad ao ag ar am au at az bs bh bd bb by be bz bj bt bo ba bw br bn bg bf bi cv kh cm ca cf td cl cn co km cg cd cr ci hr cu cy cz dk dj dm do ec eg sv gq er ee sz et fj fi fr ga gm ge de gh gr gd gt gn gw gy ht hn hu is in id ir iq ie il it jm jp jo kz ke ki kp kr kw kg la lv lb ls lr ly li lt lu mg mw my mv ml mt mh mr mu mx fm md mc mn me ma mz mm na nr np nl nz ni ne ng mk no om pk pw ps pa pg py pe ph pl pt qa ro ru rw kn lc vc ws sm st sa sn rs sc sl sg sk si sb so za ss es lk sd sr se ch sy tj tz th tl tg to tt tn tr tm tv ug ua ae gb us uy uz vu va ve vn ye zm zw'.split(' ');
const names = new Intl.DisplayNames(['en'], { type: 'region' });
const countryHighlights = {
	in: 'its diverse cultures, cricket, and the Taj Mahal', au: 'the Great Barrier Reef and its vast outback',
	pk: 'its mountain ranges, cricket, and Indus Valley heritage', gb: 'its literary heritage and the birthplace of cricket',
	lk: 'its tea plantations, ancient cities, and cricket', bd: 'its river deltas, textile industry, and cricket',
	lu: 'its financial sector and medieval castles', sg: 'global trade, hawker food, and its city skyline',
	ie: 'its literary tradition and green landscapes', jp: 'its cuisine, technology, and cherry blossoms',
	ca: 'its forests, lakes, and maple leaf flag', ch: 'the Alps, watchmaking, and its square flag',
	dk: 'its design tradition and cycling culture', pl: 'its historic cities and Baltic coast',
	id: 'its many islands, volcanoes, and diverse cultures', no: 'its fjords and northern lights',
	is: 'its volcanoes, hot springs, and northern lights', fi: 'its lakes, saunas, and northern lights',
	br: 'the Amazon rainforest and football', ar: 'tango, Patagonia, and football', fr: 'its art, cuisine, and architecture',
	mv: 'its coral atolls and Indian Ocean beaches', sc: 'its granite islands and protected marine habitats',
	fj: 'its coral reefs and Pacific island cultures', cn: 'its long history, the Great Wall, and manufacturing',
	us: 'its national parks, technology, and cultural diversity', va: 'St. Peter\'s Basilica and its role as the seat of the Catholic Church',
	mc: 'its Mediterranean harbor and Grand Prix', nr: 'its raised coral landscape in the Pacific',
	ru: 'its vast landscapes spanning Europe and Asia', it: 'its art, architecture, and regional cuisine',
	mx: 'its cuisine, ancient cities, and varied landscapes', np: 'the Himalayas, Mount Everest, and its double-pennant flag'
};
const countries = countryCodes.map(code => {
	const metadata = countryStats.countries[code] || {};
	const location = metadata.subregion || metadata.region || 'the world';
	const description = countryHighlights[code]
		? `A country in ${location} known for ${countryHighlights[code]}.`
		: `A country in ${location}${metadata.capital ? `, with its capital in ${metadata.capital}` : ''}.`;
	return { ...metadata, code, description, name: code === 'va' ? 'Vatican City' : names.of(code.toUpperCase()) };
});

const mockTopics = [
	{ pattern: /rich|wealth|gdp|money|econom/, label: 'Wealth, by GDP per person.', answers: [['lu', 'A high-income financial hub.'], ['sg', 'A global center for finance and trade.'], ['ie', 'A high GDP per capita economy.']], detail: 'Illustrative GDP-per-capita matches. The answer depends on the year, source, and whether you mean total GDP, wealth, or GDP per person.' },
	{ pattern: /cricket|batting|wicket|ipl/, label: 'Cricket is a way of life here.', answers: [['in', 'Home to the IPL and a huge cricket following.'], ['au', 'A long history of international cricket success.'], ['pk', 'A passionate, cricket-loving nation.'], ['gb', 'England is the birthplace of cricket.'], ['lk', 'An island with a celebrated cricket tradition.'], ['bd', 'Cricket is the most popular sport.']] },
	{ pattern: /red.*white|white.*red/, label: 'Two colors. Plenty of character.', answers: [['jp', 'A red sun on a white field.'], ['ca', 'The unmistakable red maple leaf.'], ['ch', 'A white cross on a red square.'], ['dk', 'A white Nordic cross on red.'], ['pl', 'White above red, in two simple bands.'], ['id', 'Red above white, in two equal bands.']] },
	{ pattern: /northern|aurora/, label: 'Look up. The sky has plans.', answers: [['no', 'Tromso sits beneath the auroral oval.'], ['is', 'Dark winter skies and wide-open landscapes.'], ['fi', 'Lapland is a favorite for aurora watching.']] },
	{ pattern: /football|soccer|world cup/, label: 'The beautiful game lives here.', answers: [['br', 'A country synonymous with football.'], ['ar', 'Home to generations of football legends.'], ['fr', 'A powerhouse of international football.']] },
	{ pattern: /island|beach|tropic/, label: 'A little closer to paradise.', answers: [['mv', 'Coral atolls in the Indian Ocean.'], ['sc', 'Granite islands and turquoise water.'], ['fj', 'An archipelago in the South Pacific.']] },
	{ pattern: /populat|people|largest population/, label: 'Home to billions of stories.', answers: [['in', 'The world\'s most populous country.'], ['cn', 'A population of more than a billion.'], ['us', 'One of the largest national populations.']] },
	{ pattern: /smallest|tiny/, label: 'Small on the map. Big on character.', answers: [['va', 'The smallest sovereign state by area.'], ['mc', 'A compact city-state on the Mediterranean.'], ['nr', 'A small island republic in the Pacific.']] },
	{ pattern: /large|biggest|area/, label: 'A whole lot of world to explore.', answers: [['ru', 'The largest country by land area.'], ['ca', 'Vast landscapes across northern America.'], ['cn', 'One of the world\'s largest countries.']] },
	{ pattern: /food|pasta|pizza|cuisine/, label: 'Worth the trip. Worth a second helping.', answers: [['it', 'Pasta, pizza, and deeply regional traditions.'], ['jp', 'From sushi counters to ramen shops.'], ['mx', 'A rich and diverse culinary heritage.']] },
	{ pattern: /happy|happiest|happiness/, label: 'A few famously happy places.', answers: [['fi', 'Often leads global happiness reports.'], ['dk', 'Known for quality of life and social trust.'], ['is', 'Community, nature, and a high quality of life.']] }
];
