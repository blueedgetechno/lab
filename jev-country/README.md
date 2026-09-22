# Jev Country

[Back to the lab](../README.md) | [Live page](https://lab.blueedge.me/jev-country/)

[![Jev Country search interface with colorful country flags](../assets/jev-country-preview.png)](https://lab.blueedge.me/jev-country/)

Ask a question about the world and find matching countries. This experiment
uses TypeSafe AI's Jev evaluation model through OpenJev or Vercel AI Gateway,
with a local mock mode for exploring without credentials.

## Run Locally

Follow the [shared setup](../README.md#run-locally) with Node.js 22 or newer,
then open http://127.0.0.1:3000/jev-country/.

For live search, set `OPENJEV_API_KEY` in the server environment or an ignored
`.env.local` file at the repository root; see [.env.example](../.env.example).
For the optional Gateway provider, set `VERCEL_AI_KEY` (or `AI_GATEWAY_API_KEY`).
Restart the server after changing keys. The VS Code **Launch local server**
configuration also reads that file.

Without a key, enable **Settings > Mock search**. Mock mode works without an
API backend and uses curated topics and country-name matches. Its percentages
are illustrative relevance scores, not Jev probabilities.

Never commit credentials or put them in browser code. Rotate any key shared in
chat or previously committed. Gateway may require a valid credit card on file
to activate credits, even when using its free allowance.

## Providers and Search

**Settings > Use OpenJev** is enabled by default. The server calls
`https://api.openjev.sh/v1/systemone` with model `openjev`, converting its
`noul` yes/no probabilities to match scores. Turning the toggle off uses
`typesafe-ai/jev` through the official AI SDK's experimental evaluation API
and Vercel AI Gateway. Only the selected provider's key is required;
neither key is sent to the browser.

The browser sends only the query and provider selection to
`POST /api/jev-country`. All 195 countries are evaluated independently in one
batch. Up to six results with estimated match probability at least 65% are
shown, highest first. Queries and country metadata are sent to the selected
provider (Vercel/TypeSafe or OpenJev/TypeSafe).

Mock mode disables the OpenJev toggle and overrides both live providers.
Switching modes or providers cancels pending searches and reruns the current
query using the selected source. Editing the query clears existing results
immediately; a replacement search starts after one second of idle typing.

## Learnings and Limits

- Model estimates are not verified facts or a measured accuracy guarantee.
  The 65% cutoff is an initial heuristic, not a calibrated threshold.
- Curated descriptions and the World Bank snapshot remain separate from
  model output. See [data sources](logic/SOURCES.md) for provenance.
- Provider caches are separate; timeouts and request limits are shared.
  There is no automatic provider fallback, and errors never substitute mock answers.
- Superseded browser requests are cancelled to avoid showing stale results.

Requests have a 20-second provider timeout, no automatic retries, a
240-character query limit, and a 4 KiB body limit. The local process allows
two concurrent evaluations and 30 uncached requests per minute, caching up to
100 queries for five minutes in memory.

Run `npm test` from the repository root for offline API tests.

## Deployment

### Vercel

The [Vercel function](../api/jev-country.js) serves `POST /api/jev-country`
using the same [search handler](server.cjs) as the local Node server.
The frontend already calls this same-origin URL; no browser configuration
or exposed API keys are needed.

1. Import this repository into Vercel with the repository root as the Root
  Directory and **Other** as the Framework Preset. Use Node.js 24.x.
2. Keep the build settings from [vercel.json](../vercel.json): `npm run build`
  and output directory `dist`. The build copies browser assets only;
  the API is deployed separately as a Node function with its country catalog.
3. Add `OPENJEV_API_KEY` to the Vercel environment variables for the deployment
  environments you use. Add `VERCEL_AI_KEY` or `AI_GATEWAY_API_KEY` only if
  you also want the optional Vercel AI Gateway provider.
4. For a custom domain, add `JEV_ALLOWED_ORIGINS`, for example
  `https://lab.blueedge.me`. Multiple origins can be comma-separated.
  Vercel deployment, branch, and production URLs are recognized through
  `VERCEL_URL`, `VERCEL_BRANCH_URL`, and `VERCEL_PROJECT_PRODUCTION_URL`.
  Keep Vercel's system environment variables exposed to the function.
5. Deploy, attach your custom domain to the Vercel project if applicable,
  and open `/jev-country/`. Redeploy after changing environment variables.

The function has a 30-second platform budget; provider requests still time
out after 20 seconds. Requests must target an allowed host and, when an
Origin header is present, it must match that host's configured origin.
This does not allow a separate GitHub Pages frontend to call the API.

The cache, concurrency cap, and rate limiter are **per warm function instance**,
not deployment-wide. Origin checks are not authentication and do not stop
direct scripted requests. Before public promotion, configure Vercel Firewall
rate limiting or authentication and provider spending limits. Use a shared
store if you need a strict global quota. Client cancellation behavior on the
host also depends on Vercel's function settings; the provider timeout remains
the upper bound within each running request.

Do not upload `.env.local` or put keys in frontend variables. The local server
remains loopback-only, and `npm start` still works without Vercel tooling.
GitHub Pages cannot execute the function; use mock mode there, or host this
frontend and API together on Vercel.

## References

- [OpenJev documentation](https://openjev.sh/docs)
- [Country data sources and attribution](logic/SOURCES.md)
- [Server implementation](server.cjs) and [offline tests](server.test.cjs)