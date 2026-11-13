$ErrorActionPreference = 'Stop'
$metadataUrl = 'https://raw.githubusercontent.com/mledoze/countries/master/countries.json'
$populationUrl = 'https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&mrnev=1&per_page=400'
$gdpUrl = 'https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&mrnev=1&per_page=400'
$metadata = Invoke-RestMethod -Uri $metadataUrl
$population = Invoke-RestMethod -Uri $populationUrl
$gdp = Invoke-RestMethod -Uri $gdpUrl
if ($population[0].pages -ne 1 -or $gdp[0].pages -ne 1) { throw 'Unexpected pagination; raise per_page before refreshing.' }
$populationByCode = @{}
$gdpByCode = @{}
foreach ($record in $population[1]) { $populationByCode[$record.countryiso3code] = $record }
foreach ($record in $gdp[1]) { $gdpByCode[$record.countryiso3code] = $record }
$records = [ordered]@{}
foreach ($country in $metadata) {
    $populationRecord = $populationByCode[$country.cca3]
    $gdpRecord = $gdpByCode[$country.cca3]
    $records[$country.cca2.ToLowerInvariant()] = [ordered]@{
        region = $country.region
        subregion = $country.subregion
        capital = ($country.capital -join ', ')
        population = $populationRecord.value
        populationYear = $populationRecord.date
        gdp = $gdpRecord.value
        gdpYear = $gdpRecord.date
    }
}
if ($records.Count -lt 195 -or $records['in'].population -le 0 -or $records['in'].gdp -le 0) { throw 'Incomplete source data; existing snapshot has not been changed.' }
$snapshot = [ordered]@{
    fetchedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
    sources = [ordered]@{ metadata = $metadataUrl; population = $populationUrl; gdp = $gdpUrl }
    attribution = 'Country metadata adapted from mledoze/countries. Indicators: The World Bank, World Development Indicators, and its data providers.'
    licenses = [ordered]@{ metadata = 'https://opendatacommons.org/licenses/odbl/1-0/'; indicators = 'https://data.worldbank.org/summary-terms-of-use' }
    countries = $records
}
$json = $snapshot | ConvertTo-Json -Depth 8 -Compress -EscapeHandling EscapeNonAscii
Set-Content -LiteralPath (Join-Path $PSScriptRoot 'country-stats.js') -Value "const countryStats = $json;" -Encoding utf8
Write-Output "Updated country-stats.js: $($records.Count) country records. Population and GDP are dated, independently sourced observations."