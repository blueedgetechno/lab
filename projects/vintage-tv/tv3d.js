import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { TrackballControls } from 'three/addons/controls/TrackballControls.js'
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js'

const element = (id) => document.getElementById(id)
const motion = matchMedia('(prefers-reduced-motion: reduce)')

async function initialize() {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  const gltf = await new GLTFLoader().loadAsync('./wooden-tv.glb')
  const scene = new THREE.Scene()
  scene.add(gltf.scene)
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
  const host = document.createElement('div')
  host.className = 'scene-viewport'
  const css = new CSS3DRenderer()
  host.append(css.domElement, renderer.domElement)
  document.querySelector('main').append(host)
  renderer.domElement.tabIndex = 0
  renderer.domElement.setAttribute('aria-label', 'Wooden television. Drag to rotate, right-drag to pan, scroll to zoom. Use the toolbar for TV controls.')
  const orbit = new TrackballControls(camera, renderer.domElement)
  orbit.rotateSpeed = 2.4
  orbit.panSpeed = 0.65
  orbit.zoomSpeed = 1.1
  orbit.staticMoving = true
  orbit.dynamicDampingFactor = 0.15
  orbit.minDistance = 4.8
  orbit.maxDistance = 22
  const fitDistance = () => Math.max(9.2, 5.6 / (2 * Math.tan(THREE.MathUtils.degToRad(19)) * (innerWidth / innerHeight)))
  let previousFit = fitDistance()
  const resetView = () => {
    orbit.update()
    orbit.reset()
    orbit.target.set(0, 1.95, 0)
    const distance = fitDistance()
    camera.position.set(distance * 0.27, 1.95 + distance * 0.1, distance)
    camera.up.set(0, 1, 0)
    camera.lookAt(orbit.target)
    orbit.update()
  }
  resetView()
  scene.add(new THREE.HemisphereLight(0xf0f5ff, 0x757b66, 3))
  const key = new THREE.DirectionalLight(0xffedcf, 4.3)
  key.position.set(-3, 7, 5)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.left = -6
  key.shadow.camera.right = 6
  key.shadow.camera.top = 7
  key.shadow.camera.bottom = -5
  key.shadow.bias = -0.001
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xb4e4f0, 2)
  rim.position.set(4, 4, -4)
  scene.add(rim)
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.16 }))
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)
  const buttons = []
  const speakers = []
  const antennas = []
  const buttonActions = { Button_Random: 'dial', Button_Previous: 'previous', Button_Next: 'next', Button_Power: 'power' }
  const names = { dial: 'Random channel', previous: 'Previous channel', next: 'Next channel', power: 'Power' }
  gltf.scene.traverse((obj) => {
    if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true }
    if (buttonActions[obj.name]) { obj.userData.action = buttonActions[obj.name]; buttons.push(obj) }
    if (obj.name.startsWith('Speaker_Cone') || obj.name.startsWith('Speaker_Cap')) speakers.push(obj)
    if (obj.name === 'Antenna_Left' || obj.name === 'Antenna_Right') antennas.push(obj)
    obj.userData.restPosition = obj.position.clone()
    obj.userData.restRotation = obj.rotation.clone()
  })

  const screen = document.querySelector('.screen')
  screen.classList.add('three-screen')
  const display = new CSS3DObject(screen)
  display.position.set(-0.48, 1.74, 0.844)
  display.scale.setScalar(2.4 / 960)
  const cssScene = new THREE.Scene()
  cssScene.add(display)
  const opening = new THREE.Shape()
  opening.moveTo(-1.11, -0.825)
  opening.lineTo(1.11, -0.825)
  opening.quadraticCurveTo(1.2, -0.825, 1.2, -0.735)
  opening.lineTo(1.2, 0.735)
  opening.quadraticCurveTo(1.2, 0.825, 1.11, 0.825)
  opening.lineTo(-1.11, 0.825)
  opening.quadraticCurveTo(-1.2, 0.825, -1.2, 0.735)
  opening.lineTo(-1.2, -0.735)
  opening.quadraticCurveTo(-1.2, -0.825, -1.11, -0.825)
  const aperture = new THREE.Mesh(new THREE.ShapeGeometry(opening), new THREE.MeshBasicMaterial({ color: 0, opacity: 0, blending: THREE.NoBlending, side: THREE.FrontSide }))
  aperture.position.copy(display.position)
  aperture.renderOrder = -1
  scene.add(aperture)
  const toolbar = document.createElement('div')
  toolbar.className = 'scene-toolbar'
  toolbar.setAttribute('role', 'toolbar')
  toolbar.setAttribute('aria-label', 'Television and scene controls')
  toolbar.append(document.querySelector('.controls'))
  document.body.append(toolbar)
  function tool(id, icon, label, action) {
    const button = document.createElement('button')
    button.id = id
    button.type = 'button'
    button.title = label
    button.setAttribute('aria-label', label)
    button.innerHTML = `<i data-lucide="${icon}"></i>`
    button.addEventListener('click', action)
    toolbar.append(button)
    return button
  }
  tool('resume-video', 'play', 'Resume playback', () => element('start').click())
  const pan = tool('pan-scene', 'move', 'Pan scene', () => {
    const active = pan.getAttribute('aria-pressed') !== 'true'
    pan.setAttribute('aria-pressed', String(active))
    orbit.mouseButtons.LEFT = active ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE
  })
  pan.setAttribute('aria-pressed', 'false')
  tool('reset-view', 'rotate-ccw', 'Reset view', resetView)
  let soundEnabled = true
  const effects = tool('sound-effects', 'audio-lines', 'Mechanical sound effects', () => {
    soundEnabled = !soundEnabled
    effects.setAttribute('aria-pressed', String(soundEnabled))
  })
  effects.setAttribute('aria-pressed', 'true')
  window.lucide?.createIcons()
  document.body.classList.add('three-ready')

  let audio
  function sound() {
    if (!soundEnabled) return
    audio ??= new AudioContext()
    if (audio.state === 'suspended') audio.resume().catch(() => {})
    const now = audio.currentTime
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(210, now)
    oscillator.frequency.exponentialRampToValueAtTime(55, now + 0.09)
    gain.gain.setValueAtTime(0.09, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11)
    oscillator.connect(gain).connect(audio.destination)
    oscillator.start(now)
    oscillator.stop(now + 0.12)
  }
  const channelKnob = buttons.find(obj => obj.userData.action === 'dial')
  const dialPivot = new THREE.Group()
  dialPivot.position.copy(channelKnob.position)
  channelKnob.parent.add(dialPivot)
  scene.updateMatrixWorld(true)
  dialPivot.attach(channelKnob)
  const dialMarker = gltf.scene.getObjectByName('Dial_Marker')
  dialPivot.attach(dialMarker)
  channelKnob.userData.restPosition.copy(channelKnob.position)
  dialMarker.userData.action = 'dial'
  dialMarker.userData.restPosition.copy(dialMarker.position)
  let dialTarget = 0
  let pulseUntil = 0
  const presses = new Map()
  const activate = (action) => {
    if (element(action)?.disabled) return
    const now = performance.now()
    presses.set(action, now)
    if (['previous', 'next', 'dial'].includes(action)) {
      pulseUntil = now + 520
      dialTarget += (action === 'previous' ? 1 : -1) * Math.PI / 6
    }
    sound()
  }
  toolbar.addEventListener('click', (event) => {
    const button = event.target.closest('button')
    if (button && button.id !== 'sound-effects') activate(button.id)
  }, true)
  window.addEventListener('tv:tune', () => { pulseUntil = performance.now() + 520 })
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const tooltip = document.createElement('div')
  tooltip.className = 'scene-tooltip'
  tooltip.hidden = true
  document.body.append(tooltip)
  function hit(event) {
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1)
    raycaster.setFromCamera(pointer, camera)
    const closest = raycaster.intersectObject(gltf.scene, true)[0]
    return closest?.object.userData.action ? closest.object : null
  }
  let down
  renderer.domElement.addEventListener('pointerdown', (event) => {
    down = { x: event.clientX, y: event.clientY, id: event.pointerId, button: event.button }
  })
  renderer.domElement.addEventListener('pointermove', (event) => {
    const obj = hit(event)
    tooltip.hidden = !obj || event.buttons !== 0
    if (obj) {
      tooltip.textContent = names[obj.userData.action]
      tooltip.style.left = `${Math.min(event.clientX + 12, innerWidth - 145)}px`
      tooltip.style.top = `${event.clientY - 35}px`
    }
  })
  renderer.domElement.addEventListener('pointerleave', () => { tooltip.hidden = true })
  renderer.domElement.addEventListener('pointercancel', () => { down = null })
  renderer.domElement.addEventListener('pointerup', (event) => {
    if (!down || down.id !== event.pointerId || down.button !== 0 || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6) { down = null; return }
    down = null
    const obj = hit(event)
    if (obj) element(obj.userData.action).click()
  })
  function resize() {
    const distance = fitDistance()
    camera.position.sub(orbit.target).multiplyScalar(distance / previousFit).add(orbit.target)
    previousFit = distance
    camera.aspect = innerWidth / innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(innerWidth, innerHeight)
    css.setSize(innerWidth, innerHeight)
    orbit.handleResize()
  }
  addEventListener('resize', resize)
  resize()
  css.render(cssScene, camera)
  const noise = element('noise')
  const context = noise.getContext('2d')
  const image = context.createImageData(160, 120)
  let lastNoise = 0
  renderer.setAnimationLoop((time) => {
    orbit.update()
    const state = window.analogTV.getState()
    const tuning = time < pulseUntil && state.powered
    dialPivot.rotation.z = motion.matches ? dialTarget : THREE.MathUtils.lerp(dialPivot.rotation.z, dialTarget, 0.22)
    for (const obj of antennas) {
      obj.rotation.copy(obj.userData.restRotation)
      if (tuning && !motion.matches) obj.rotation.z += Math.sin(time * 0.06) * 0.035 * (pulseUntil - time) / 520
    }
    for (const obj of speakers) {
      obj.position.copy(obj.userData.restPosition)
      if (!motion.matches && state.powered && (tuning || state.playing && !state.muted)) obj.position.z += Math.sin(time * 0.032) * 0.014
    }
    for (const obj of buttons) {
      obj.position.copy(obj.userData.restPosition)
      const age = time - (presses.get(obj.userData.action) ?? -1000)
      if (age < 220 && !motion.matches) obj.position.z -= Math.sin(age / 220 * Math.PI) * 0.055
    }
    dialMarker.position.copy(dialMarker.userData.restPosition)
    dialMarker.position.z += channelKnob.position.z - channelKnob.userData.restPosition.z
    if (tuning && !motion.matches && time - lastNoise > 45) {
      for (let offset = 0; offset < image.data.length; offset += 4) {
        const shade = Math.random() * 255
        image.data[offset] = shade
        image.data[offset + 1] = shade
        image.data[offset + 2] = shade
        image.data[offset + 3] = 255
      }
      context.putImageData(image, 0, 0)
      lastNoise = time
    }
    noise.classList.toggle('active', tuning && !motion.matches)
    screen.style.visibility = camera.position.z > display.position.z ? 'visible' : 'hidden'
    renderer.render(scene, camera)
    css.render(cssScene, camera)
  })
  window.tvScene = { scene, camera, renderer, orbit, buttons, antennas, speakers, resetView, get pulseUntil() { return pulseUntil } }
}

initialize().catch((error) => {
  console.error('3D television could not load', error)
  element('status').textContent = '3D view unavailable. Standard television controls remain available.'
}).finally(() => window.analogTV.mountPlayer())