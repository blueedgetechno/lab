const test = require("node:test")
const assert = require("node:assert/strict")
const http = require("node:http")
const { once, EventEmitter } = require("node:events")
const { spawn } = require("node:child_process")
const path = require("node:path")
const fs = require("node:fs")
const vm = require("node:vm")
const { createCountrySearchHandler } = require("./server.cjs")

async function startServer(context, options) {
  const server = http.createServer(createCountrySearchHandler({ apiKey: "test-key-not-real", ...options }))
  server.listen(0, "127.0.0.1")
  await once(server, "listening")
  context.after(() => { server.closeAllConnections(); server.close() })
  const url = `http://127.0.0.1:${server.address().port}/api/jev-country`
  return (query, options = {}) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, provider: "vercel" }), ...options })
}

function answersFor(questions, probabilities = {}) {
  return { answers: Object.fromEntries(Object.keys(questions).map(code => [code, { type: "boolean", probability: probabilities[code] ?? 0.01 }])) }
}

async function invokeHostedHandler(handler, overrides = {}) {
  const request = {
    method: "POST",
    headers: { host: "lab.example.com", origin: "https://lab.example.com", "content-type": "application/json" },
    socket: { localPort: 12345 },
    body: { query: "India", provider: "vercel" },
    ...overrides,
  }
  const response = new EventEmitter()
  response.writeHead = (status, headers) => { response.status = status; response.headers = headers }
  response.end = text => { response.body = JSON.parse(text) }
  await handler(request, response)
  return response
}

test("hosted handler accepts Vercel parsed bodies and preserves validation", async () => {
  let calls = 0
  const handler = createCountrySearchHandler({
    allowedOrigins: ["https://lab.example.com"],
    apiKey: "test-key-not-real",
    evaluate: async ({ questions }) => { calls++; return answersFor(questions, { in: .98 }) },
  })
  for (const body of [{ query: "India", provider: "vercel" }, '{"query":"India","provider":"vercel"}', Buffer.from('{"query":"India","provider":"vercel"}')]) {
    const response = await invokeHostedHandler(handler, { body })
    assert.equal(response.status, 200)
    assert.deepEqual(response.body.countries, [{ code: "in", score: 98 }])
    assert.equal(response.headers["Cache-Control"], "no-store")
  }
  for (const body of [null, [], 1, "{", { query: "" }, { query: "a".repeat(241) }]) {
    assert.equal((await invokeHostedHandler(handler, { body })).status, 400)
  }
  assert.equal((await invokeHostedHandler(handler, { body: { query: "India", extra: "a".repeat(4096) } })).status, 413)
  const headers = { host: "lab.example.com", origin: "https://lab.example.com", "content-type": "application/json", "content-length": "4097" }
  assert.equal((await invokeHostedHandler(handler, { headers })).status, 413)
  const throwingRequest = { method: "POST", headers: { ...headers, "content-length": "1" }, get body() { throw new SyntaxError("private parse details") } }
  const response = new EventEmitter()
  response.writeHead = status => { response.status = status }
  response.end = text => { response.body = text }
  await handler(throwingRequest, response)
  assert.equal(response.status, 400)
  assert.ok(!response.body.includes("private parse details"))
  assert.equal(calls, 1)
})

test("hosted origin allowlist rejects forged hosts and cross-origin requests", async () => {
  let calls = 0
  const handler = createCountrySearchHandler({
    allowedOrigins: ["https://lab.example.com", "https://preview.example.vercel.app"],
    apiKey: "test-key-not-real",
    evaluate: async ({ questions }) => { calls++; return answersFor(questions) },
  })
  const base = { host: "lab.example.com", origin: "https://lab.example.com", "content-type": "application/json" }
  for (const change of [
    { origin: "https://evil.example" }, { origin: "http://lab.example.com" },
    { host: "evil.example", origin: "https://evil.example", "x-forwarded-host": "lab.example.com" },
    { origin: "https://preview.example.vercel.app" }, { "sec-fetch-site": "cross-site" },
    { host: "127.0.0.1:12345", origin: "http://127.0.0.1:12345" },
  ]) assert.equal((await invokeHostedHandler(handler, { headers: { ...base, ...change } })).status, 403)
  assert.equal(calls, 0)
  assert.equal((await invokeHostedHandler(handler, { headers: { ...base, host: "preview.example.vercel.app", origin: "https://preview.example.vercel.app" } })).status, 200)
  assert.equal((await invokeHostedHandler(handler, { headers: { host: "lab.example.com", "content-type": "application/json" } })).status, 200)
  const unconfigured = createCountrySearchHandler({ allowedOrigins: [] })
  assert.equal((await invokeHostedHandler(unconfigured)).status, 403)
})

test("Vercel endpoint shares the handler and allows only its deployment and configured domains", async () => {
  let calls = 0
  const environment = {
    VERCEL: "1",
    VERCEL_URL: "lab-hash.vercel.app",
    VERCEL_BRANCH_URL: "lab-git-main.vercel.app",
    VERCEL_PROJECT_PRODUCTION_URL: "lab.vercel.app",
    JEV_ALLOWED_ORIGINS: "https://lab.example.com, https://www.lab.example.com/",
  }
  const module = { exports: {} }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../api/jev-country.js"), "utf8"), {
    module,
    process: { env: environment },
    require: name => {
      assert.equal(name, "../jev-country/server.cjs")
      return { createCountrySearchHandler: options => createCountrySearchHandler({
        ...options,
        openJevApiKey: "test-openjev-key-not-real",
        fetchOpenJev: async (_url, options) => {
          calls++
          const { questions } = JSON.parse(options.body)
          assert.equal(Object.keys(questions).length, 195)
          return Response.json(openJevAnswersFor(questions, { in: .97 }))
        },
      }) }
    },
  })
  assert.equal(typeof module.exports, "function")
  for (const host of ["lab-hash.vercel.app", "lab-git-main.vercel.app", "lab.vercel.app", "lab.example.com", "www.lab.example.com"]) {
    const response = await invokeHostedHandler(module.exports, {
      headers: { host, origin: `https://${host}`, "content-type": "application/json" },
      body: { query: "India" },
    })
    assert.equal(response.status, 200)
    assert.equal(response.body.provider, "openjev")
    assert.deepEqual(response.body.countries, [{ code: "in", score: 97 }])
  }
  assert.equal(calls, 1)
  assert.equal((await invokeHostedHandler(module.exports, { method: "GET" })).status, 405)
  assert.equal((await invokeHostedHandler(module.exports, { headers: { host: "other.vercel.app", origin: "https://other.vercel.app" } })).status, 403)
})

test("evaluates all 195 countries, ranks real probabilities, and caches queries", async context => {
  let calls = 0
  const search = await startServer(context, { evaluate: async ({ state, questions, abortSignal }, key) => {
    calls++
    assert.equal(state.query, "cricket")
    assert.equal(Object.keys(questions).length, 195)
    assert.equal(questions.in.instructions.country.name, "India")
    assert.ok(abortSignal instanceof AbortSignal)
    assert.equal(key, "test-key-not-real")
    return answersFor(questions, { in: .98, au: .92, pk: .85, gb: .84, lk: .83, bd: .82, nz: .81, us: .64 })
  } })
  const response = await search("cricket")
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.model, "typesafe-ai/jev")
  assert.deepEqual(body.countries.map(country => country.code), ["in", "au", "pk", "gb", "lk", "bd"])
  assert.equal(body.countries[0].score, 98)
  assert.equal((await search(" CRICKET ")).status, 200)
  assert.equal(calls, 1)
})

test("country questions pass the real AI SDK input and output validation", async context => {
  const { experimental_evaluate } = await import("ai")
  let evaluated = false
  const search = await startServer(context, { evaluate: options => experimental_evaluate({
    ...options,
    model: {
      specificationVersion: "v4",
      provider: "test",
      modelId: "jev-test",
      supportedQuestionTypes: ["boolean"],
      doEvaluate: async ({ questions }) => {
        evaluated = true
        assert.equal(Object.keys(questions).length, 195)
        return { ...answersFor(questions, { in: .99 }), usage: { inputTokens: 100, outputTokens: 0 }, warnings: [] }
      },
    },
  }) })
  const response = await search("India")
  assert.equal(response.status, 200)
  assert.equal(evaluated, true)
  assert.deepEqual((await response.json()).countries, [{ code: "in", score: 99 }])
})

function openJevAnswersFor(questions, probabilities = {}) {
  return { answers: Object.fromEntries(Object.keys(questions).map(code => [code, { type: "noul", noul: probabilities[code] ?? 0.01 }])) }
}

test("OpenJev is the default, sends authenticated noul questions and isolates provider caches", async context => {
  let openJevCalls = 0
  let gatewayCalls = 0
  const search = await startServer(context, {
    openJevApiKey: "openjev-test-key-not-real",
    fetchOpenJev: async (url, options) => {
      openJevCalls++
      assert.equal(url, "https://api.openjev.sh/v1/systemone")
      assert.equal(options.method, "POST")
      assert.equal(options.headers.Authorization, "Bearer openjev-test-key-not-real")
      assert.equal(options.headers["Content-Type"], "application/json")
      assert.equal(options.redirect, "error")
      assert.ok(options.signal instanceof AbortSignal)
      const body = JSON.parse(options.body)
      assert.equal(body.model, "openjev")
      assert.equal(body.state.query, "cricket")
      assert.equal(Object.keys(body.questions).length, 195)
      assert.ok(Object.values(body.questions).every(question => question.type === "noul"))
      assert.equal(body.questions.in.instructions.country.name, "India")
      return Response.json(openJevAnswersFor(body.questions, { in: .98, au: .92, pk: .85, gb: .84, lk: .83, bd: .82, nz: .81, us: .64 }))
    },
    evaluate: async ({ questions }) => { gatewayCalls++; return answersFor(questions, { ca: .95 }) },
  })
  const body = JSON.stringify({ query: "cricket" })
  const response = await search("", { body })
  assert.equal(response.status, 200)
  const answer = await response.json()
  assert.equal(answer.model, "openjev")
  assert.equal(answer.provider, "openjev")
  assert.deepEqual(answer.countries.map(country => country.code), ["in", "au", "pk", "gb", "lk", "bd"])
  assert.equal(answer.countries[0].score, 98)
  assert.deepEqual((await (await search("cricket")).json()).countries, [{ code: "ca", score: 95 }])
  assert.deepEqual(await (await search("", { body: JSON.stringify({ query: " CRICKET ", provider: "openjev" }) })).json(), answer)
  assert.equal(openJevCalls, 1)
  assert.equal(gatewayCalls, 1)
})

test("OpenJev validates provider selection, credentials and upstream failures", async context => {
  let gatewayCalls = 0
  const body = JSON.stringify({ query: "India", provider: "openjev" })
  const missingKey = await startServer(context, { openJevApiKey: "", evaluate: async () => { gatewayCalls++ } })
  for (const provider of [null, true, 12, {}, "other", "https://example.com"]) {
    assert.equal((await missingKey("", { body: JSON.stringify({ query: "India", provider }) })).status, 400)
  }
  const missing = await missingKey("", { body })
  assert.equal(missing.status, 503)
  assert.match((await missing.json()).error, /OPENJEV_API_KEY/)
  for (const [upstream, expected] of [[401, 503], [403, 503], [422, 502], [429, 429], [503, 503], [500, 502]]) {
    const search = await startServer(context, {
      apiKey: "",
      openJevApiKey: "openjev-test-key-not-real",
      evaluate: async () => { gatewayCalls++ },
      fetchOpenJev: async () => new Response("private-provider-detail", { status: upstream, headers: { "Retry-After": "17" } }),
    })
    const response = await search("", { body })
    assert.equal(response.status, expected)
    if (upstream === 429) assert.equal(response.headers.get("retry-after"), "17")
    const message = await response.text()
    assert.ok(message.includes("OpenJev"))
    assert.ok(!message.includes("private-provider-detail"))
  }
  assert.equal(gatewayCalls, 0)
})

test("OpenJev rejects incomplete, malformed and invalid probabilities", async context => {
  for (const invalid of [undefined, null, "0.9", -0.1, 1.1, "wrong-type", "missing", "non-json"]) {
    const search = await startServer(context, {
      apiKey: "",
      openJevApiKey: "openjev-test-key-not-real",
      fetchOpenJev: async (_, options) => {
        if (invalid === "non-json") return new Response("not json")
        const result = openJevAnswersFor(JSON.parse(options.body).questions)
        if (invalid === "wrong-type") result.answers.in = { type: "boolean", probability: .99 }
        else if (invalid === "missing") delete result.answers.in
        else result.answers.in.noul = invalid
        return Response.json(result)
      },
    })
    assert.equal((await search("", { body: JSON.stringify({ query: "India", provider: "openjev" }) })).status, 502)
  }
})

test("OpenJev works without a Gateway key and sanitizes network and timeout errors", async context => {
  for (const mode of ["empty", "network", "timeout"]) {
    const search = await startServer(context, {
      apiKey: "",
      openJevApiKey: "openjev-test-key-not-real",
      fetchOpenJev: async (_, options) => {
        if (mode === "network") throw new TypeError("private-network-detail")
        if (mode === "timeout") throw new DOMException("private-timeout-detail", "TimeoutError")
        return Response.json(openJevAnswersFor(JSON.parse(options.body).questions))
      },
    })
    const response = await search("", { body: JSON.stringify({ query: "India", provider: "openjev" }) })
    assert.equal(response.status, mode === "empty" ? 200 : mode === "timeout" ? 504 : 502)
    const answer = await response.json()
    if (mode === "empty") assert.deepEqual(answer.countries, [])
    else {
      assert.match(answer.error, /OpenJev/)
      assert.ok(!answer.error.includes("private-"))
    }
  }
})

test("OpenJev HTTP request is aborted when the client disconnects", { timeout: 5000 }, async context => {
  let announceStarted
  const started = new Promise(resolve => { announceStarted = resolve })
  const search = await startServer(context, {
    openJevApiKey: "openjev-test-key-not-real",
    fetchOpenJev: (_, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true })
      announceStarted(options.signal)
    }),
  })
  const controller = new AbortController()
  const pending = search("", { body: JSON.stringify({ query: "India", provider: "openjev" }), signal: controller.signal }).catch(error => error.name)
  const signal = await started
  const aborted = once(signal, "abort")
  controller.abort()
  await aborted
  assert.equal(await pending, "AbortError")
  assert.ok(signal.aborted)
})

test("rejects invalid, oversized, and cross-origin requests before evaluating", async context => {
  let calls = 0
  const search = await startServer(context, { evaluate: async () => { calls++ } })
  for (const query of [null, 12, {}, "", " ", "a".repeat(241)]) assert.equal((await search(query)).status, 400)
  assert.equal((await search("x", { body: "{" })).status, 400)
  assert.equal((await search("x", { body: "x".repeat(4097) })).status, 413)
  assert.equal((await search("x", { headers: { "Content-Type": "text/plain" } })).status, 415)
  assert.equal((await search("x", { headers: { "Content-Type": "application/json", Origin: "https://example.com" } })).status, 403)
  const endpoint = (await search("x", { method: "GET", body: undefined })).url
  const forbiddenHost = await new Promise((resolve, reject) => {
    const request = http.request(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Host: "example.com" } }, response => {
      response.resume()
      resolve(response.statusCode)
    })
    request.on("error", reject)
    request.end(JSON.stringify({ query: "x" }))
  })
  assert.equal(forbiddenHost, 403)
  const get = await search("x", { method: "GET", body: undefined })
  assert.equal(get.status, 405)
  assert.equal(get.headers.get("allow"), "POST")
  assert.equal(calls, 0)
})

test("returns no matches without inventing scores", async context => {
  const search = await startServer(context, { evaluate: async ({ questions }) => answersFor(questions) })
  assert.deepEqual((await (await search("fictional place")).json()).countries, [])
})

test("handles missing keys and upstream failures without leaking provider details", async context => {
  const unconfigured = await startServer(context, { apiKey: "" })
  assert.equal((await unconfigured("India")).status, 503)
  for (const [statusCode, expected] of [[401, 503], [402, 503], [429, 429], [500, 502]]) {
    const search = await startServer(context, { evaluate: async () => { throw Object.assign(new Error("private-provider-detail"), { statusCode }) } })
    const response = await search("India")
    assert.equal(response.status, expected)
    assert.ok(!(await response.text()).includes("private-provider-detail"))
  }
  const timeout = await startServer(context, { evaluate: async () => { throw new DOMException("Timed out", "TimeoutError") } })
  assert.equal((await timeout("India")).status, 504)
})

test("rejects missing and invalid model probabilities", async context => {
  for (const probability of [undefined, "0.9", NaN, -0.1, 1.1]) {
    const search = await startServer(context, { evaluate: async ({ questions }) => {
      const result = answersFor(questions)
      result.answers.in.probability = probability
      return result
    } })
    assert.equal((await search("India")).status, 502)
  }
})

test("bounds requests and expires cached results", async context => {
  let time = 0
  let calls = 0
  const search = await startServer(context, { now: () => time, evaluate: async ({ questions }) => { calls++; return answersFor(questions) } })
  for (let index = 0; index < 30; index++) assert.equal((await search(`query ${index}`)).status, 200)
  const limited = await search("another query")
  assert.equal(limited.status, 429)
  assert.equal(limited.headers.get("retry-after"), "60")
  assert.equal((await search("query 0")).status, 200)
  assert.equal(calls, 30)
  time = 300001
  assert.equal((await search("query 0")).status, 200)
  assert.equal(calls, 31)
})

test("limits concurrent evaluations and aborts them when clients disconnect", { timeout: 5000 }, async context => {
  const signals = []
  let announceStarted
  const started = new Promise(resolve => { announceStarted = resolve })
  const search = await startServer(context, { evaluate: ({ abortSignal }) => new Promise((resolve, reject) => {
    signals.push(abortSignal)
    abortSignal.addEventListener("abort", () => reject(abortSignal.reason), { once: true })
    if (signals.length === 2) announceStarted()
  }) })
  const controllers = [new AbortController(), new AbortController()]
  const pending = controllers.map(controller => search("India", { signal: controller.signal }).catch(error => error.name))
  await started
  assert.equal((await search("Canada")).status, 429)
  const aborted = Promise.all(signals.map(signal => once(signal, "abort")))
  controllers.forEach(controller => controller.abort())
  await aborted
  assert.deepEqual(await Promise.all(pending), ["AbortError", "AbortError"])
  assert.ok(signals.every(signal => signal.aborted))
})

test("Vercel static build publishes browser assets without secrets or server sources", async context => {
  const { buildStatic } = require("../common/build-static.cjs")
  const root = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "lab-static-test-"))
  context.after(() => fs.rmSync(root, { recursive: true, force: true }))
  for (const directory of ["assets", "isometric-room", "jev-country", "procedurally-fish-animation", "vintage-tv"]) {
    fs.mkdirSync(path.join(root, directory), { recursive: true })
  }
  const fixtures = {
    "index.html": "<html>Lab</html>", "robots.txt": "User-agent: *", "sitemap.xml": "<urlset/>",
    "assets/flag.svg": "<svg/>", "jev-country/index.html": "<html>Countries</html>",
    "jev-country/logic/data.js": "const countries = []", "jev-country/logic/country-stats.js": "const stats = {}",
    "vintage-tv/channels.json": "[]", "isometric-room/interactions.css": "body {}",
    ".env.local": "fake-secret", ".vscode/launch.json": "{}", "node_modules/private.js": "private",
    "api/jev-country.js": "server-only", "jev-country/server.cjs": "server-only",
    "jev-country/server.test.cjs": "tests", "jev-country/logic/example.test.js": "tests",
    "jev-country/demo/record.cjs": "recording-helper", "jev-country/demo/preview.mp4": "video",
    "jev-country/logic/.private.json": "private", "vintage-tv/build-tv.py": "build-script",
  }
  for (const [relative, text] of Object.entries(fixtures)) {
    fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true })
    fs.writeFileSync(path.join(root, relative), text)
  }
  const output = await buildStatic(root)
  for (const relative of ["index.html", "robots.txt", "sitemap.xml", "assets/flag.svg", "jev-country/index.html", "jev-country/logic/data.js", "jev-country/logic/country-stats.js", "vintage-tv/channels.json", "isometric-room/interactions.css"]) {
    assert.equal(fs.readFileSync(path.join(output, relative), "utf8"), fixtures[relative])
  }
  for (const relative of [".env.local", ".vscode", "node_modules", "api", "jev-country/server.cjs", "jev-country/server.test.cjs", "jev-country/logic/example.test.js", "jev-country/demo", "jev-country/logic/.private.json", "vintage-tv/build-tv.py"]) {
    assert.equal(fs.existsSync(path.join(output, relative)), false, relative)
  }
  fs.unlinkSync(path.join(root, "assets/flag.svg"))
  await buildStatic(root)
  assert.equal(fs.existsSync(path.join(output, "assets/flag.svg")), false)
  fs.unlinkSync(path.join(output, ".lab-static-build"))
  await assert.rejects(buildStatic(root), /Refusing to replace dist/)
  assert.equal(fs.existsSync(path.join(output, "index.html")), true)
})

test("shared server opens the lab index and blocks private paths including Windows aliases", { timeout: 10000 }, async context => {
  const child = spawn(process.execPath, [path.join(__dirname, "../common/serve.cjs")], { env: { ...process.env, PORT: "0" } })
  context.after(() => child.kill())
  const [output] = await once(child.stdout, "data")
  assert.match(String(output).trim(), /^Blue Edge Lab: http:\/\/127\.0\.0\.1:\d+\/$/)
  const base = String(output).match(/http:\/\/127\.0\.0\.1:\d+/)[0]
  const index = await fetch(base + "/")
  assert.equal(index.status, 200)
  assert.equal(await index.text(), await (await fetch(base + "/index.html")).text())
  assert.equal((await fetch(base + "/common/serve.cjs")).status, 403)
  for (const resource of ["/.vscode/launch.json", "/%2evscode/launch.json", "/.env.local", "/.git/config", "/node_modules/ai/package.json", "/NODE_MODULES/ai/package.json", "/node_modules./ai/package.json", "/assets%5c..%5c.env.local", "/jev-country/server.cjs", "/jev-country/server.cjs.", "/.env.local%3A%3A$DATA"]) {
    assert.equal((await fetch(base + resource)).status, 403, resource)
  }
  assert.equal((await fetch(base + "/jev-country/")).status, 200)
  assert.equal((await fetch(base + "/jev-country")).status, 200)
  assert.equal((await fetch(base + "/jev-country/logic/search.js")).status, 200)
  assert.equal((await fetch(base + "/api/jev-country")).status, 405)
})