import { describe, expect, it } from 'vitest'
import type { PlayerId } from 'engine/client'
import type { SeatStatus } from 'protocol'
import { isRematch, rematchOffer } from './rematch.ts'

const alice = 'alice' as PlayerId
const bob = 'bob' as PlayerId

const seat = (player: PlayerId, isHost: boolean): SeatStatus => ({
  player,
  claimed: true,
  online: true,
  displayName: null,
  isBot: false,
  deck: null,
  ready: true,
  isHost,
})

describe('isRematch', () => {
  it('is a later game of the same room', () => {
    expect(isRematch({ roomId: 'ABCDE', game: 1 }, { roomId: 'ABCDE', game: 2 })).toBe(true)
    expect(isRematch({ roomId: 'ABCDE', game: 2 }, { roomId: 'ABCDE', game: 3 })).toBe(true)
  })

  it('is not another frame of the same game, nor a first frame', () => {
    expect(isRematch({ roomId: 'ABCDE', game: 2 }, { roomId: 'ABCDE', game: 2 })).toBe(false)
    expect(isRematch(null, { roomId: 'ABCDE', game: 2 })).toBe(false)
  })

  it("is not another room's game, whatever its number", () => {
    // A blitz straight after a rematched room: its first game is no rematch.
    expect(isRematch({ roomId: 'ABCDE', game: 1 }, { roomId: 'FGHJK', game: 2 })).toBe(false)
    expect(isRematch({ roomId: 'ABCDE', game: 3 }, { roomId: 'FGHJK', game: 1 })).toBe(false)
  })
})

describe('rematchOffer', () => {
  const seats = [seat(alice, true), seat(bob, false)]

  it('gives the host the button, named for a blitz in a blitz room', () => {
    expect(rematchOffer({ canRematch: true, isHost: true, blitz: false, seats })).toEqual({
      kind: 'button',
      label: 'Rematch',
    })
    expect(rematchOffer({ canRematch: true, isHost: true, blitz: true, seats })).toEqual({
      kind: 'button',
      label: 'Blitz again',
    })
  })

  it('has everyone else wait on the host, by seat when they hold one', () => {
    expect(rematchOffer({ canRematch: true, isHost: false, blitz: false, seats })).toEqual({
      kind: 'waiting',
      host: alice,
    })
    expect(rematchOffer({ canRematch: true, isHost: false, blitz: false, seats: [seat(bob, false)] })).toEqual({
      kind: 'waiting',
      host: null,
    })
  })

  it('offers nothing in a room that can’t be rematched', () => {
    expect(rematchOffer({ canRematch: false, isHost: true, blitz: false, seats })).toBeNull()
  })
})
