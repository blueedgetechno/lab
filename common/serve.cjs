const http = require("node:http")
const fs = require("node:fs/promises")
const path = require("node:path")

const root = path.resolve(__dirname, "..")
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
}
let countrySearchHandler

const server = http.createServer(async (request, response) => {
  if (request.url?.split("?")[0] === "/api/jev-country") {
    countrySearchHandler ||= require("../jev-country/server.cjs").createCountrySearchHandler()
    await countrySearchHandler(request, response)
    return
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" })
    response.end()
    return
  }
  let file
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname)
    if (/[\\:\0]/.test(pathname) || pathname.split("/").some(segment => segment.startsWith(".") || segment.replace(/[. ]+$/, "").toLowerCase() === "node_modules") || /\.(?:cjs|mjs|code-workspace)[. ]*$/i.test(pathname)) {
      response.writeHead(403)
      response.end("Forbidden")
      return
    }
    file = path.resolve(root, `.${pathname}`)
    const relative = path.relative(root, file)
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      response.writeHead(403)
      response.end("Forbidden")
      return
    }
  } catch {
    response.writeHead(400)
    response.end("Bad request")
    return
  }
  try {
    if ((await fs.stat(file)).isDirectory()) file = path.join(file, "index.html")
    const data = await fs.readFile(file)
    response.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Cache-Control": "no-store",
    })
    response.end(request.method === "HEAD" ? undefined : data)
  } catch {
    response.writeHead(404)
    response.end("Not found")
  }
})

server.listen(Number(process.env.PORT ?? 3000), "127.0.0.1", () => {
  console.log(`Blue Edge Lab: http://127.0.0.1:${server.address().port}/`)
})