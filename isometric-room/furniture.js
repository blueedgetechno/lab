export function prepareFurniture({ THREE, model, nodes, register, state, toyCar }) {
  const wood = new THREE.MeshStandardMaterial({ color: 0xa66c32, roughness: .65 })
  const paper = new THREE.MeshStandardMaterial({ color: 0xf3e7cf, roughness: .9 })
  const teal = new THREE.MeshStandardMaterial({ color: 0x457d71, roughness: .8 })
  const bounds = object => new THREE.Box3().setFromObject(object)
  const center = object => bounds(object).getCenter(new THREE.Vector3())
  const matching = expression => nodes.filter(object => expression.test(object.name))
  function box(parent, name, position, size, material = wood) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material)
    mesh.name = name
    mesh.position.set(...position)
    mesh.castShadow = mesh.receiveShadow = true
    parent.add(mesh)
    return mesh
  }
  function pivot(name, objects, position) {
    const group = new THREE.Group()
    group.name = name
    group.position.copy(position)
    model.add(group)
    model.updateMatrixWorld(true)
    for (const object of objects) group.attach(object)
    return group
  }
  const drawerGroups = []
  function cabinet(body, fronts, handles, family, label, travel, sideFacing = false) {
    const outer = bounds(body)
    const size = outer.getSize(new THREE.Vector3())
    const shell = new THREE.Group()
    shell.name = `${family}-carcass`
    shell.position.copy(outer.getCenter(new THREE.Vector3()))
    shell.rotation.y = sideFacing ? Math.PI / 2 : 0
    model.add(shell)
    model.updateMatrixWorld(true)
    const width = sideFacing ? size.z : size.x
    const depth = sideFacing ? size.x : size.z
    const height = size.y
    const skin = .035
    const material = body.material
    body.visible = false
    for (const side of [-1, 1]) box(shell, `${family}-side`, [side * (width - skin) / 2, 0, 0], [skin, height, depth], material)
    for (const side of [-1, 1]) box(shell, `${family}-cap`, [0, side * (height - skin) / 2, 0], [width - skin * 2, skin, depth], material)
    box(shell, `${family}-back`, [0, 0, -(depth - skin) / 2], [width - skin * 2, height, skin], material)
    fronts.sort((first, second) => center(second).y - center(first).y)
    fronts.forEach((front, index) => {
      const frontBounds = bounds(front)
      const frontHeight = frontBounds.max.y - frontBounds.min.y
      const frontCenter = frontBounds.getCenter(new THREE.Vector3())
      const local = shell.worldToLocal(frontCenter.clone())
      const group = new THREE.Group()
      group.name = `${family}-${index + 1}-drawer`
      group.position.y = local.y
      shell.add(group)
      model.updateMatrixWorld(true)
      group.attach(front)
      for (const handle of handles.filter(handle => Math.abs(center(handle).y - frontCenter.y) < .07)) group.attach(handle)
      const innerWidth = width - skin * 2 - .025
      const innerDepth = depth - skin * 2 - .03
      const innerHeight = frontHeight - .045
      box(group, `${family}-drawer-bottom`, [0, -frontHeight / 2 + .025, 0], [innerWidth, .025, innerDepth])
      for (const side of [-1, 1]) box(group, `${family}-drawer-side`, [side * (innerWidth - .025) / 2, -.005, 0], [.025, innerHeight, innerDepth])
      box(group, `${family}-drawer-back`, [0, -.005, -(innerDepth - .025) / 2], [innerWidth, innerHeight, .025])
      const id = fronts.length === 1 ? family : `${family}-${index + 1}`
      register(id, `${label}${fronts.length > 1 ? ` ${index + 1}` : ''}`, [group], value => { group.position.z = value * travel })
      if (family === 'desk-drawer') {
        for (let index = 0; index < 3; index++) box(group, 'Stationery', [-.38 + index * .16, -frontHeight / 2 + .046, .1], [.025, .012, .25], index === 1 ? teal : paper)
      } else if (!(family === 'nightstand' && index === 0)) {
        box(group, 'Folded linen', [0, -frontHeight / 2 + .072, .025], [innerWidth * .63, .065, innerDepth * .6], paper)
      }
      drawerGroups.push({ id, group, innerWidth, innerDepth, floor: -frontHeight / 2 + .04 })
    })
  }
  cabinet(model.getObjectByName('Nightstand_cabinet'), matching(/^Nightstand_drawer/), matching(/^Drawer_brass_knob/), 'nightstand', 'Bedside drawer', .38)
  cabinet(model.getObjectByName('Back_dresser'), matching(/^Dresser_drawer/), matching(/^Dresser_knob/), 'dresser', 'Dresser drawer', .32)
  const deskBody = model.getObjectByName('Desk_shallow_drawer')
  const deskBounds = bounds(deskBody)
  const deskFront = box(model, 'Desk drawer front', [deskBounds.max.x - .012, center(deskBody).y, center(deskBody).z], [.025, .12, deskBounds.max.z - deskBounds.min.z - .10], deskBody.material)
  cabinet(deskBody, [deskFront], matching(/^Desk_drawer_handle/), 'desk-drawer', 'Desk drawer', .14, true)

  const secretDrawer = drawerGroups.find(drawer => drawer.id === 'nightstand-1')
  const carBounds = bounds(toyCar)
  const carSize = carBounds.getSize(new THREE.Vector3())
  const carCenter = carBounds.getCenter(new THREE.Vector3())
  const carScale = Math.min(.40 / carSize.x, .13 / carSize.y, .24 / carSize.z)
  toyCar.scale.setScalar(carScale)
  toyCar.position.set(-carCenter.x * carScale, secretDrawer.floor - carBounds.min.y * carScale, .15 - carCenter.z * carScale)
  toyCar.name = 'Hidden miniature toy car'
  toyCar.traverse(object => {
    if (object.isMesh) object.castShadow = object.receiveShadow = true
  })
  secretDrawer.group.add(toyCar)

  const lidObjects = matching(/^Laptop_display_frame|^Laptop_blue_display|^Screen_text_bar/)
  const lid = pivot('Laptop hinge', lidObjects, new THREE.Vector3(-2.47, 1.15, -.21))
  register('laptop', 'Laptop lid', [lid, ...matching(/^Laptop_base|^Keyboard_row/)], value => {
    lid.rotation.z = -(1 - value) * 1.69
    state.laptop = value > .5
  }, { initial: true })
  const screen = model.getObjectByName('Laptop_blue_display')
  const screenGeometry = screen.geometry
  const screenBounds = screenGeometry.boundingBox
  const screenSize = screenBounds.getSize(new THREE.Vector3())
  const screenPosition = screenGeometry.attributes.position
  const screenUV = screenGeometry.attributes.uv
  for (let index = 0; index < screenUV.count; index++) {
    screenUV.setXY(index, (screenPosition.getZ(index) - screenBounds.min.z) / screenSize.z, (screenPosition.getY(index) - screenBounds.min.y) / screenSize.y)
  }
  screenUV.needsUpdate = true
  const screenCanvas = document.createElement('canvas')
  screenCanvas.width = 384
  screenCanvas.height = 240
  const context = screenCanvas.getContext('2d')
  const texture = new THREE.CanvasTexture(screenCanvas)
  texture.colorSpace = THREE.SRGBColorSpace
  screen.material = new THREE.MeshBasicMaterial({ map: texture })
  for (const text of matching(/^Screen_text_bar/)) text.visible = false
  let screenMode
  function updateScreen() {
    const mode = !state.laptop ? 'off' : state.night && !state.lamp ? 'stars' : 'study'
    state.screen = mode
    if (screenMode === mode) return
    screenMode = mode
    context.fillStyle = mode === 'off' ? '#10151b' : mode === 'stars' ? '#111f39' : '#367c83'
    context.fillRect(0, 0, 384, 240)
    if (mode === 'stars') {
      context.fillStyle = '#ffebad'
      for (let index = 0; index < 38; index++) {
        const radius = index % 3 === 0 ? 2 : 1
        context.beginPath()
        context.arc(12 + (index * 97) % 360, 12 + (index * 53) % 214, radius, 0, Math.PI * 2)
        context.fill()
      }
      context.beginPath()
      context.arc(287, 66, 24, 0, Math.PI * 2)
      context.fill()
      context.fillStyle = '#111f39'
      context.beginPath()
      context.arc(297, 58, 24, 0, Math.PI * 2)
      context.fill()
    } else if (mode === 'study') {
      context.fillStyle = '#f5e9ce'
      context.fillRect(55, 30, 274, 180)
      context.fillStyle = '#83afa2'
      for (let row = 0; row < 6; row++) context.fillRect(78, 55 + row * 23, row % 2 ? 152 : 219, 6)
    }
    texture.needsUpdate = true
  }

  const chair = pivot('Chair assembly', matching(/^Chair_/), center(model.getObjectByName('Chair_seat')))
  const chairRest = chair.position.clone()
  register('chair', 'Desk chair', [chair], value => { chair.position.copy(chairRest); chair.position.z += value * .46 })
  const plantParts = matching(/^Floor_plant/)
  const plant = pivot('Plant foliage', plantParts.filter(object => /stem|leaf/.test(object.name)), new THREE.Vector3(-2.24, .61, 1.83))
  register('plant', 'Floor plant', [plant, ...plantParts.filter(object => /pot|soil/.test(object.name))], value => {
    plant.rotation.z = value === 1 ? 0 : Math.sin(value * Math.PI * 5) * .10 * (1 - value)
    plant.rotation.x = value === 1 ? 0 : Math.sin(value * Math.PI * 4) * .045 * (1 - value)
  }, { transient: true, duration: 1.1 })
  const cushion = model.getObjectByName('Teal_bed_cushion')
  const cushionBounds = bounds(cushion)
  const cushionPivot = pivot('Cushion base', [cushion], new THREE.Vector3(center(cushion).x, cushionBounds.min.y, center(cushion).z))
  register('cushion', 'Bed cushion', [cushionPivot], value => {
    const compression = value === 1 ? 0 : Math.sin(value * Math.PI * 3) * .23 * (1 - value)
    cushionPivot.scale.set(1 + compression * .18, 1 - compression, 1 + compression * .18)
  }, { transient: true, duration: .75 })
  const artwork = pivot('Artwork hanging point', matching(/^Wall_artwork|^Artwork_/), new THREE.Vector3(.64, 2.86, -2.425))
  register('artwork', 'Picture frame', [artwork], value => { artwork.rotation.z = value * -.10 })
  const clockHands = matching(/^Clock_minute_hand|^Clock_hour_hand/).map(object => pivot(`${object.name} pivot`, [object], new THREE.Vector3(2.23, 2.66, -2.34)))
  register('clock', 'Wall clock', [...clockHands, ...matching(/^Round_wall_clock|^Clock_dial|^Clock_center_pin/)], value => {
    clockHands.forEach((hand, index) => { hand.rotation.z = value === 1 ? 0 : -Math.PI * 2 * (index + 1) * (1 - Math.pow(1 - value, 3)) })
  }, { transient: true, duration: 1.1 })

  const originalBook = model.getObjectByName('Book_on_pouf')
  const book = new THREE.Group()
  book.name = 'Opening book'
  book.position.copy(originalBook.position)
  book.quaternion.copy(originalBook.quaternion)
  model.add(book)
  originalBook.visible = false
  box(book, 'Book lower cover', [0, -.025, 0], [.36, .01, .28], teal)
  box(book, 'Book pages', [0, -.005, 0], [.335, .029, .256], paper)
  const cover = new THREE.Group()
  cover.name = 'Book spine hinge'
  cover.position.set(-.18, .017, 0)
  book.add(cover)
  box(cover, 'Book upper cover', [.18, 0, 0], [.36, .012, .28], teal)
  const bookmark = box(book, 'Hidden bookmark', [.07, .011, -.015], [.038, .003, .205], new THREE.MeshStandardMaterial({ color: 0xd77138 }))
  register('book', 'Pouf book', [book], value => {
    cover.rotation.z = value * 2.55
    bookmark.visible = value > .15
  })
  updateScreen()
  return { drawerGroups, lid, chair, book, cover, bookmark, toyCar, updateScreen }
}