# Country Data

The application opens directly from `index.html`. Ordered classic scripts avoid local-file module and fetch restrictions. Flag images, fonts, Matter.js and Lucide still require an internet connection.

- `country-stats.js`: generated local snapshot; includes retrieval date, source URLs, values and observation years.
- `data.js`: indexed country list, editorial descriptions and mocked search topics.
- `ui.js`: tooltip positioning, statistics formatting and country details.
- `search.js`: mock search, cancellation and the configurable 1,000 ms debounce.
- `flags.js`: Matter.js world, native-proportion canvas rendering and interactions. Flight duration is 800 ms; growth and shrink finish in its first 80 ms. One eligible settled flag is recycled every 500 ms. Selected, dragged and tooltip-visible flags are excluded.

## Sources And Licenses

Country regions and capitals are adapted from [mledoze/countries](https://github.com/mledoze/countries), made available under the [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/). The adapted geographic metadata is available under the same license in the accompanying machine-readable snapshot; the refresh script documents the transformation.

Population and GDP: The World Bank, World Development Indicators, and its data providers. Indicators are [SP.POP.TOTL](https://data.worldbank.org/indicator/SP.POP.TOTL) and [NY.GDP.MKTP.CD](https://data.worldbank.org/indicator/NY.GDP.MKTP.CD). Use is subject to [CC BY 4.0 and the World Bank's additional terms](https://data.worldbank.org/summary-terms-of-use), including attribution requirements for redistribution.

The importer requests the latest non-empty observation per indicator, not a common year. GDP is total GDP in current US dollars, not purchasing-power-adjusted GDP or GDP per capita. Tooltip figures are compactly rounded, retain their own observation years, and link to the source indicator. Missing observations display `Unavailable`; no figures are fabricated or imputed. Geographic metadata includes territories, but the app indexes only its explicit 195-country list.

Short descriptions combine geographic metadata with editorial summaries. Search topics and percentage badges are illustrative mock relevance, not sourced rankings, probabilities or model confidence. The richest-country topic loosely illustrates GDP-per-capita matches, not a ranking by the total GDP shown in tooltips. No Jev API is called.

Flag PNG artwork is loaded from [FlagCDN](https://flagcdn.com/), with natural proportions and alpha transparency preserved. Collision bodies remain rectangular.

## Refresh

Run from the project root using PowerShell 7:

```powershell
./logic/refresh-data.ps1
```

This refreshes only the generated snapshot. It checks pagination and required sample values before writing. Existing data remains available at runtime without requests to the metadata or World Bank APIs.