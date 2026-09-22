<p align="center">
  <a href="https://lab.blueedge.me/"><img src="assets/favicon.svg" width="64" height="64" alt="Blue Edge Lab" /></a>
</p>

<h1 align="center">Blue Edge Lab</h1>

<p align="center"><strong>New models. Small experiments. Learnings in public.</strong></p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&amp;size=17&amp;duration=2800&amp;pause=1200&amp;color=2563EB&amp;center=true&amp;vCenter=true&amp;width=600&amp;height=40&amp;lines=Try+an+idea.+Build+it.+See+what+breaks.;Keep+the+experiment.+Share+the+learnings." alt="Try an idea. Build it. See what breaks. Keep the experiment. Share the learnings." />
</p>

<p align="center">
  <a href="https://lab.blueedge.me/"><img src="https://img.shields.io/badge/Visit_the_lab-2563EB?style=for-the-badge&amp;logo=googlechrome&amp;logoColor=white" alt="Visit the lab" /></a>
  <a href="https://github.com/blueedgetechno/lab/stargazers"><img src="https://img.shields.io/github/stars/blueedgetechno/lab?style=for-the-badge&amp;color=facc15&amp;logo=github&amp;logoColor=black" alt="GitHub stars" /></a>
  <a href="https://github.com/blueedgetechno/lab/forks"><img src="https://img.shields.io/github/forks/blueedgetechno/lab?style=for-the-badge&amp;color=5eead4&amp;logo=github&amp;logoColor=black" alt="GitHub forks" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/last-commit/blueedgetechno/lab?style=flat-square&amp;color=2563eb" alt="Last commit" />
  <img src="https://img.shields.io/badge/building-in_public-f472b6?style=flat-square" alt="Building in public" />
  <img src="https://img.shields.io/badge/status-always_experimenting-a3e635?style=flat-square" alt="Always experimenting" />
</p>

## Why This Repo

This is my playground for experimenting with new AI models, turning ideas into
working demos, and posting what I learn along the way. By [Blue Edge](https://blueedge.me).

The goal isn't a polished product every time. It's to explore what these models
can help me build, where they struggle, and what it takes to make the results
work. Project READMEs hold the implementation notes, limitations, and learnings.

## The Experiments

<table>
  <tr>
    <td width="50%" align="center">
      <a href="procedurally-fish-animation/README.md"><img src="assets/fish-preview.png" width="100%" alt="Colorful procedural fish swimming in a pond" /><br /><strong>Just Keep Swimming</strong></a>
    </td>
    <td width="50%" align="center">
      <a href="vintage-tv/README.md"><img src="assets/vintage-tv-preview.png" width="100%" alt="A wooden vintage television" /><br /><strong>Analog TV</strong></a>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <a href="isometric-room/README.md"><img src="assets/cozy-room-preview.png" width="100%" alt="An interactive isometric bedroom" /><br /><strong>Cozy Room</strong></a>
    </td>
    <td width="50%" align="center">
      <a href="jev-country/README.md"><img src="assets/jev-country-preview.png" width="100%" alt="Jev Country search with colorful flags" /><br /><strong>Jev Country</strong></a>
    </td>
  </tr>
</table>

## Directory

| Experiment | Project README | Live |
| --- | --- | --- |
| Just Keep Swimming | [procedurally-fish-animation](procedurally-fish-animation/README.md) | [Open](https://lab.blueedge.me/procedurally-fish-animation/) |
| Analog TV | [vintage-tv](vintage-tv/README.md) | [Open](https://lab.blueedge.me/vintage-tv/) |
| Cozy Room | [isometric-room](isometric-room/README.md) | [Open](https://lab.blueedge.me/isometric-room/) |
| Jev Country | [jev-country](jev-country/README.md) | [Open](https://lab.blueedge.me/jev-country/) |

## Run Locally

With **Node.js 22+**, run from the repository root:

```sh
npm install
npm start
```

Open **http://127.0.0.1:3000/**. No build step. Project-specific requirements,
including optional API keys, live in the READMEs above.

## Deploy to Vercel

Import the repository root with the **Other** framework preset. The included
[configuration](vercel.json) builds browser assets into `dist` and deploys
[the country-search API](api/jev-country.js) at `/api/jev-country`.
See [Jev Country deployment](jev-country/README.md#vercel) for provider keys,
custom-domain origins, and public-endpoint limits. GitHub Pages remains
static-only and cannot run the API.

---

<p align="center">
  <img src="https://img.shields.io/badge/JavaScript-f7df1e?style=for-the-badge&amp;logo=javascript&amp;logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/p5.js-ed225d?style=for-the-badge&amp;logo=p5dotjs&amp;logoColor=white" alt="p5.js" />
  <img src="https://img.shields.io/badge/Three.js-222222?style=for-the-badge&amp;logo=threedotjs&amp;logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/Blender-e87d0d?style=for-the-badge&amp;logo=blender&amp;logoColor=white" alt="Blender" />
</p>

<p align="center"><a href="https://blueedge.me">blueedge.me</a> &middot; <a href="https://x.com/blueedgetechno">Follow the experiments</a> &middot; <a href="https://github.com/blueedgetechno/lab/issues">Share an idea</a></p>