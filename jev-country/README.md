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

The live page needs a server-side `POST /api/jev-country` endpoint and a secret
key for the selected provider. GitHub Pages and static-only hosting cannot
execute it; use mock mode there unless a backend is provided.

The included Node server is loopback-only for local development. Public
deployment needs a backend adapted to the target host, authentication or
abuse protection, and shared rate limits. Do not publish local environment
files. No production backend is included in this setup.

## References

- [OpenJev documentation](https://openjev.sh/docs)
- [Country data sources and attribution](logic/SOURCES.md)
- [Server implementation](server.cjs) and [offline tests](server.test.cjs)