import { createIcons, Hand, RotateCcw, Volume2, VolumeX, X, Plus, Minus, ArrowLeft } from 'lucide'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { prepareFurniture } from './furniture.js'
import { createRoomAudio } from './sounds.js'

export async function setupInteractions({ THREE, scene, camera, renderer, model, controls, key, fill, rim, lamp, render }) {
  const toyCar = (await new GLTFLoader().loadAsync('./toy-car.glb')).scene
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  const actions = new Map()
  const canvas = renderer.domElement
  const nodes = [...model.children]
  const state = { lamp: true, night: false }
  const panel = document.createElement('section')
  panel.className = 'objects-panel'
  panel.id = 'room-objects'
  panel.hidden = true
  panel.setAttribute('aria-label', 'Room objects')
  const heading = document.createElement('header')
  heading.innerHTML = '<span>Room objects</span>'
  const close = document.createElement('button')
  close.type = 'button'
  close.setAttribute('aria-label', 'Close objects')
  close.innerHTML = '<i data-lucide="x"></i>'
  heading.append(close)
  const list = document.createElement('div')
  list.className = 'objects-list'
  panel.append(heading, list)
  const announcement = document.createElement('div')
  announcement.className = 'sr-only'
  announcement.setAttribute('role', 'status')
  document.body.append(panel, announcement)
  const toolbar = document.querySelector('.toolbar')
  function tool(icon, label, callback) {
    const button = document.createElement('button')
    button.type = 'button'
    button.title = label
    button.setAttribute('aria-label', label)
    button.innerHTML = `<i data-lucide="${icon}"></i>`
    button.addEventListener('click', callback)
    toolbar.append(button)
    return button
  }
  function hidePanel() {
    panel.hidden = true
    objectsButton.setAttribute('aria-expanded', 'false')
    highlight(null)
  }
  const objectsButton = tool('hand', 'Room objects', () => {
    if (!panel.hidden) return hidePanel()
    panel.hidden = false
    objectsButton.setAttribute('aria-expanded', 'true')
    list.querySelector('button')?.focus()
  })
  objectsButton.setAttribute('aria-expanded', 'false')
  objectsButton.setAttribute('aria-controls', panel.id)
  close.addEventListener('click', () => { hidePanel(); objectsButton.focus() })
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { hidePanel(); objectsButton.focus() }
  })
  document.addEventListener('pointerdown', event => {
    if (!panel.hidden && !panel.contains(event.target) && !objectsButton.contains(event.target)) hidePanel()
  })
  const audio = createRoomAudio(() => {
    updateSoundButton()
    announcement.textContent = 'Sound unavailable. Room controls remain active.'
  })
  function updateSoundButton() {
    soundButton.setAttribute('aria-pressed', String(audio.enabled))
    soundButton.innerHTML = `<i data-lucide="${audio.enabled ? 'volume-2' : 'volume-x'}"></i>`
    createIcons({ icons: { Hand, RotateCcw, Volume2, VolumeX, X, Plus, Minus, ArrowLeft } })
  }
  const soundButton = tool('volume-x', 'Sound effects', () => {
    audio.setEnabled(!audio.enabled)
    updateSoundButton()
    if (audio.enabled) audio.play('lamp')
  })
  soundButton.setAttribute('aria-pressed', 'false')
  const outline = new THREE.Box3Helper(new THREE.Box3(), 0xffd28e)
  outline.material.depthTest = false
  outline.material.transparent = true
  outline.material.opacity = .7
  outline.renderOrder = 10
  outline.visible = false
  scene.add(outline)
  let highlighted = null
  function highlight(id) {
    highlighted = actions.get(id)
    outline.visible = Boolean(highlighted)
    if (highlighted) {
      outline.box.makeEmpty()
      for (const object of highlighted.targets) outline.box.expandByObject(object)
    }
    render()
  }
  let frame = 0
  let previous = 0
  let environmentChanged = () => {}
  function schedule() {
    if (!frame) { previous = performance.now(); frame = requestAnimationFrame(tick) }
  }
  function tick(now) {
    frame = 0
    const delta = Math.min((now - previous) / 1000, .05)
    previous = now
    let running = false
    for (const action of actions.values()) {
      if (action.transient) {
        if (action.elapsed < action.duration) {
          action.elapsed = motion.matches ? action.duration : Math.min(action.duration, action.elapsed + delta)
          action.apply(action.elapsed / action.duration)
          running ||= action.elapsed < action.duration
        }
      } else if (action.value !== Number(action.on)) {
        action.value = motion.matches ? Number(action.on) : THREE.MathUtils.damp(action.value, Number(action.on), 12, delta)
        if (Math.abs(action.value - Number(action.on)) < .001) action.value = Number(action.on)
        action.apply(action.value)
        running ||= action.value !== Number(action.on)
      }
    }
    environmentChanged()
    if (highlighted) highlight(highlighted.id)
    else render()
    if (running) frame = requestAnimationFrame(tick)
  }
  function register(id, label, targets, apply, options = {}) {
    if (!targets.length) throw new Error(`Missing interaction target: ${id}`)
    const action = { id, label, targets, apply, initial: false, on: false, value: 0, transient: false, duration: .8, ...options }
    action.on = action.initial
    action.value = Number(action.initial)
    action.elapsed = action.duration
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = label
    button.dataset.action = id
    if (!action.transient) button.setAttribute('aria-pressed', String(action.on))
    button.addEventListener('click', () => activate(id))
    button.addEventListener('focus', () => highlight(id))
    button.addEventListener('blur', () => highlight(null))
    list.append(button)
    action.button = button
    actions.set(id, action)
    for (const object of targets) object.userData.action = id
    apply(action.transient ? 1 : action.value)
    return action
  }
  function activate(id) {
    const action = actions.get(id)
    if (!action) return false
    if (action.transient) {
      action.elapsed = 0
      if (motion.matches) highlight(id)
    } else {
      action.on = !action.on
      action.button.setAttribute('aria-pressed', String(action.on))
    }
    announcement.textContent = `${action.label}${action.transient ? '' : action.on ? ': on' : ': off'}`
    audio.play(id, action.transient || action.on)
    schedule()
    return true
  }
  const hemisphere = scene.children.find(object => object.isHemisphereLight)
  const lampParts = nodes.filter(object => /Bedside_lamp|Lamp_glowing/.test(object.name))
  const emissiveParts = lampParts.filter(object => object.material?.emissiveIntensity > 0).map(object => ({ object, intensity: object.material.emissiveIntensity }))
  register('lamp', 'Bedside lamp', lampParts, value => {
    lamp.intensity = 3 * value
    for (const part of emissiveParts) part.object.material.emissiveIntensity = part.intensity * value
    state.lamp = value >= .5
  }, { initial: true })
  const glazing = model.getObjectByName('Blue_window_glazing')
  const day = new THREE.Color(0xb99178)
  const evening = new THREE.Color(0x303b50)
  const daylight = key.color.clone()
  const moonlight = new THREE.Color(0xaecbff)
  register('night', 'Evening', nodes.filter(object => /Blue_window|Window_horizontal|Window_vertical|Window_crossbar/.test(object.name)), value => {
    state.night = value >= .5
    key.intensity = THREE.MathUtils.lerp(4.6, .65, value)
    key.color.copy(daylight).lerp(moonlight, value)
    fill.intensity = THREE.MathUtils.lerp(1.5, .3, value)
    rim.intensity = THREE.MathUtils.lerp(.35, .18, value)
    hemisphere.intensity = THREE.MathUtils.lerp(.8, .4, value)
    scene.background.copy(day).lerp(evening, value)
    scene.fog.color.copy(scene.background)
    glazing.material.color.set(0xffdc93).lerp(new THREE.Color(0x355786), value)
    glazing.material.emissive.set(0xffcc80).lerp(new THREE.Color(0x426bba), value)
  })
  const furniture = prepareFurniture({ THREE, model, nodes, register, state, toyCar })
  environmentChanged = furniture.updateScreen
  environmentChanged()
  function reset() {
    audio.stop()
    for (const action of actions.values()) {
      action.on = action.initial
      action.value = Number(action.initial)
      action.elapsed = action.duration
      action.apply(action.transient ? 1 : action.value)
      if (!action.transient) action.button.setAttribute('aria-pressed', String(action.on))
    }
    environmentChanged()
    highlight(null)
    announcement.textContent = 'Room reset'
    render()
  }
  tool('rotate-ccw', 'Reset room', reset)
  createIcons({ icons: { Hand, RotateCcw, Volume2, VolumeX, X, Plus, Minus, ArrowLeft } })
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  function pick(clientX, clientY) {
    const rect = canvas.getBoundingClientRect()
    pointer.set((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1)
    scene.updateMatrixWorld(true)
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObject(model, true).find(hit => {
      for (let object = hit.object; object; object = object.parent) if (!object.visible) return false
      return true
    })
    for (let object = hit?.object; object; object = object.parent) if (object.userData.action) return object.userData.action
    return null
  }
  let down
  const pointers = new Set()
  const tooltip = document.getElementById('tooltip')
  canvas.addEventListener('pointerdown', event => {
    pointers.add(event.pointerId)
    if (pointers.size > 1) { down = null; return }
    down = event.button === 0 ? { id: event.pointerId, x: event.clientX, y: event.clientY, action: pick(event.clientX, event.clientY), moved: false } : null
    tooltip.hidden = true
    highlight(null)
  })
  canvas.addEventListener('pointermove', event => {
    if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6) down.moved = true
    if (pointers.size) return
    const id = pick(event.clientX, event.clientY)
    canvas.style.cursor = id ? 'pointer' : 'grab'
    if (highlighted?.id !== id) highlight(id)
    tooltip.hidden = !id
    if (id) {
      tooltip.textContent = actions.get(id).label
      tooltip.style.left = `${Math.max(90, Math.min(innerWidth - 90, event.clientX))}px`
      tooltip.style.top = `${Math.max(40, event.clientY - 14)}px`
    }
  })
  canvas.addEventListener('pointerup', event => {
    pointers.delete(event.pointerId)
    const gesture = down
    down = null
    if (gesture && gesture.id === event.pointerId && !gesture.moved && gesture.action && gesture.action === pick(event.clientX, event.clientY)) activate(gesture.action)
  }, true)
  const cancel = event => { pointers.delete(event.pointerId); down = null; tooltip.hidden = true; highlight(null) }
  canvas.addEventListener('pointercancel', cancel)
  canvas.addEventListener('lostpointercapture', cancel)
  canvas.addEventListener('pointerleave', () => { tooltip.hidden = true; if (!pointers.size) highlight(null) })
  controls.addEventListener('change', () => { tooltip.hidden = true })
  motion.addEventListener('change', schedule)
  return { actions, state, activate, reset, pick, furniture, audio }
}