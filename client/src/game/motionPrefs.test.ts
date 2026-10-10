import { describe, expect, it } from 'vitest'
import { DEFAULT_MUSIC_VOLUME, DEFAULT_SOUND_VOLUME, parseSettings } from './motionPrefs.ts'

const saved = (o: object) => JSON.stringify(o)

describe('parseSettings', () => {
  it('starts both volumes at their defaults', () => {
    expect(parseSettings(null)).toMatchObject({ soundVolume: DEFAULT_SOUND_VOLUME, musicVolume: DEFAULT_MUSIC_VOLUME })
  })

  it('keeps the volumes saved, held to 0..1', () => {
    expect(parseSettings(saved({ version: 3, soundVolume: 0.25, musicVolume: 0 }))).toMatchObject({
      soundVolume: 0.25,
      musicVolume: 0,
    })
    expect(parseSettings(saved({ version: 3, soundVolume: 4, musicVolume: -1 }))).toMatchObject({
      soundVolume: 1,
      musicVolume: 0,
    })
    expect(parseSettings(saved({ version: 3, soundVolume: 'loud' }))).toMatchObject({ soundVolume: DEFAULT_SOUND_VOLUME })
  })

  it('reads sound turned off under the on/off switch as a sound volume of 0', () => {
    expect(parseSettings(saved({ version: 2, sound: false }))).toMatchObject({
      soundVolume: 0,
      musicVolume: DEFAULT_MUSIC_VOLUME,
    })
    expect(parseSettings(saved({ version: 2, sound: true }))).toMatchObject({ soundVolume: DEFAULT_SOUND_VOLUME })
  })

  it('ignores a `sound: false` saved before it was anyone\'s choice, keeping the rest', () => {
    expect(parseSettings(saved({ animScale: 1.5, sound: false }))).toMatchObject({
      animScale: 1.5,
      soundVolume: DEFAULT_SOUND_VOLUME,
    })
  })

  it('falls back to the defaults on anything unreadable', () => {
    expect(parseSettings('{not json')).toMatchObject({ soundVolume: DEFAULT_SOUND_VOLUME, animScale: 1 })
  })
})
