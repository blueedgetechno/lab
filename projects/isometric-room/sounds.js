export function soundProfile(id) {
  if (id.startsWith('nightstand-')) return 'small-slide'
  if (id.startsWith('dresser-')) return 'wood-slide'
  return {
    lamp: 'switch', night: 'slider', 'desk-drawer': 'small-slide',
    laptop: 'hinge', chair: 'scrape', plant: 'leaves', cushion: 'press',
    book: 'paper', artwork: 'tap', clock: 'clock',
  }[id] || 'switch'
}

function recipe(profile, opening) {
  const parts = []
  const noise = (start, duration, low, high, volume, attack = .02) => parts.push({ start, duration, low, high, volume, attack })
  const tone = (start, duration, frequency, endFrequency, volume, attack = .003) => parts.push({ start, duration, frequency, endFrequency, volume, attack })
  switch (profile) {
    case 'wood-slide':
    case 'small-slide': {
      const small = profile === 'small-slide'
      const duration = small ? .30 : .43
      noise(0, duration, 180, small ? 1900 : 1100, .27, .035)
      tone(.01, duration, small ? 170 : 105, opening ? 125 : 80, .035, .025)
      tone(duration - .015, .09, opening ? 240 : 150, 65, opening ? .07 : .14)
      noise(duration, .045, 300, 2300, .10, .003)
      break
    }
    case 'hinge':
      noise(0, opening ? .24 : .18, 700, 3000, .11, .025)
      tone(.01, .15, opening ? 390 : 310, opening ? 530 : 200, .023)
      noise(opening ? .22 : .17, .028, 1800, 6500, .19, .001)
      tone(opening ? .22 : .17, .065, 600, 230, .06)
      break
    case 'scrape':
      noise(0, .48, 100, 2100, .34, .04)
      noise(.13, .23, 1400, 3300, .10)
      tone(.03, .37, opening ? 190 : 160, opening ? 120 : 210, .032, .04)
      tone(.45, .08, 100, 55, .10)
      break
    case 'leaves':
      for (let index = 0; index < 6; index++) noise(index * .095, .10 + index % 2 * .08, 2400, 10500, .24 - index * .022, .024)
      break
    case 'press':
      noise(0, .22, 80, 850, .36, .045)
      tone(0, .19, 115, 52, .09, .025)
      noise(.20, .26, 350, 2200, .13, .065)
      break
    case 'paper':
      noise(0, .12, 1700, 6000, .16, .015)
      noise(.075, opening ? .32 : .23, 700, 7400, .26, .075)
      noise(.26, .14, 2100, 9000, .10, .03)
      tone(opening ? .37 : .29, .055, 220, 95, .07)
      break
    case 'tap':
      tone(0, .075, opening ? 420 : 350, 210, .11)
      noise(.025, .11, 550, 2200, .12)
      tone(.14, .05, 300, 180, .055)
      break
    case 'clock':
      for (let index = 0; index < 8; index++) {
        const start = index * .045 + index * index * .008
        noise(start, .016, 2400, 8500, .11, .001)
        tone(start, .035, index % 2 ? 1800 : 1300, 850, .045, .001)
      }
      break
    case 'slider':
      noise(0, .37, 1100, 5000, .17, .055)
      tone(.015, .30, opening ? 280 : 190, opening ? 190 : 280, .027, .035)
      noise(.35, .026, 1800, 4800, .12, .002)
      break
    default:
      noise(0, .023, 1900, 7600, .24, .001)
      tone(.005, .055, opening ? 850 : 640, 300, .08, .001)
      noise(.043, .015, 1400, 5200, .10, .001)
  }
  return parts
}

export function createSoundBuffer(context, id, opening = true) {
  const parts = recipe(soundProfile(id), opening)
  const duration = Math.max(...parts.map(part => part.start + part.duration)) + .025
  const buffer = context.createBuffer(1, Math.ceil(duration * context.sampleRate), context.sampleRate)
  const samples = buffer.getChannelData(0)
  let seed = 92821
  for (const part of parts) {
    const start = Math.round(part.start * context.sampleRate)
    const length = Math.ceil(part.duration * context.sampleRate)
    const upperCoefficient = part.high ? 1 - Math.exp(-2 * Math.PI * Math.min(part.high, context.sampleRate * .45) / context.sampleRate) : 0
    const lowerCoefficient = part.low ? 1 - Math.exp(-2 * Math.PI * part.low / context.sampleRate) : 0
    let upper = 0
    let lower = 0
    let phase = 0
    for (let index = 0; index < length && start + index < samples.length; index++) {
      const time = index / context.sampleRate
      const progress = index / length
      const attack = Math.min(1, time / part.attack)
      const envelope = Math.sin(attack * Math.PI / 2) * Math.pow(1 - progress, 1.35)
      let sample
      if (part.frequency) {
        phase += 2 * Math.PI * (part.frequency + (part.endFrequency - part.frequency) * progress) / context.sampleRate
        sample = Math.sin(phase)
      } else {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
        const white = seed / 2147483648 - 1
        upper += upperCoefficient * (white - upper)
        lower += lowerCoefficient * (white - lower)
        sample = (upper - lower) * 1.8
      }
      samples[start + index] += sample * envelope * part.volume
    }
  }
  return buffer
}

export function createRoomAudio(onError) {
  let context
  let output
  let enabled = false
  let generation = 0
  const buffers = new Map()
  const voices = new Set()
  function stop() {
    generation++
    for (const source of voices) {
      source.onended = null
      source.stop()
      source.disconnect()
    }
    voices.clear()
  }
  function setEnabled(value) {
    enabled = value
    if (output) output.gain.setValueAtTime(value ? .7 : 0, context.currentTime)
    if (!value) stop()
  }
  async function play(id = 'lamp', opening = true) {
    if (!enabled) return
    const request = generation
    try {
      if (!context) {
        context = new AudioContext()
        output = context.createGain()
        output.gain.value = .7
        output.connect(context.destination)
      }
      if (context.state !== 'running') await context.resume()
      if (!enabled || request !== generation) return
      const key = `${soundProfile(id)}:${opening}`
      if (!buffers.has(key)) buffers.set(key, createSoundBuffer(context, id, opening))
      if (voices.size >= 4) {
        const oldest = voices.values().next().value
        oldest.stop()
        oldest.disconnect()
        voices.delete(oldest)
      }
      const source = context.createBufferSource()
      source.buffer = buffers.get(key)
      source.connect(output)
      source.onended = () => { source.disconnect(); voices.delete(source) }
      voices.add(source)
      source.start()
    } catch (error) {
      setEnabled(false)
      onError?.(error)
    }
  }
  return { play, setEnabled, stop, get enabled() { return enabled }, get activeVoices() { return voices.size } }
}