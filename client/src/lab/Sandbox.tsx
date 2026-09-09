import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { LegalAction, ObjectId, PlayerId, TargetRef, VisibleObject } from 'engine'
import { CardTile } from '../ui/CardTile.tsx'
import { Symbols } from '../ui/Symbols.tsx'
import { EventLog } from '../ui/EventLog.tsx'
import { computeBoardEntries } from '../game/board.ts'
import { useSandbox } from './useSandbox.ts'

type CastAction = Extract<LegalAction, { kind: 'cast-spell' }>
type LandAction = Extract<LegalAction, { kind: 'play-land' }>
type AbilityAction = Extract<LegalAction, { kind: 'activate-ability' }>

const YOU = 'you' as PlayerId
const FOE = 'foe' as PlayerId

interface Targeting {
  readonly label: string
  readonly specs: readonly string[]
  readonly options: readonly (readonly TargetRef[])[]
  readonly picked: readonly TargetRef[]
  /** Finalise once every slot is filled. */
  readonly commit: (targets: readonly TargetRef[]) => void
}

export function Sandbox({ cardName }: { readonly cardName: string }) {
  const game = useSandbox(cardName)
  const { view, actions } = game
  const [targeting, setTargeting] = useState<Targeting | null>(null)
  const [xPrompt, setXPrompt] = useState<{ action: CastAction | AbilityAction; value: number } | null>(null)
  const [modePrompt, setModePrompt] = useState<{ cast: CastAction; picked: readonly number[] } | null>(null)
  const [picks, setPicks] = useState<readonly ObjectId[]>([])

  // A card change remounts this component (keyed), so no reset-on-prop effect.
  const awaiting = view.awaiting

  const casts = useMemo(
    () => actions.filter((a): a is CastAction => a.kind === 'cast-spell'),
    [actions],
  )
  const lands = useMemo(
    () => actions.filter((a): a is LandAction => a.kind === 'play-land'),
    [actions],
  )
  const abilitiesBySource = useMemo(() => {
    const m = new Map<ObjectId, AbilityAction[]>()
    for (const a of actions) {
      if (a.kind !== 'activate-ability') continue
      const list = m.get(a.source) ?? []
      list.push(a)
      m.set(a.source, list)
    }
    return m
  }, [actions])
  const chooseTargets = actions.find((a) => a.kind === 'choose-targets')
  // A `choose-targets` decision drives the same targeting flow; kick it off
  // once when it appears (an effect, not a render-time setState).
  const ctStartedRef = useRef(false)
  useEffect(() => {
    if (chooseTargets?.kind === 'choose-targets' && !ctStartedRef.current) {
      ctStartedRef.current = true
      setTargeting({
        label: `Choose targets for ${chooseTargets.cardName}`,
        specs: chooseTargets.specs,
        options: chooseTargets.options,
        picked: [],
        commit: (targets) =>
          game.dispatch({ type: 'choose-targets', player: YOU, targets: [...targets] }),
      })
    }
    if (!chooseTargets) ctStartedRef.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chooseTargets])
  const chooseModes = actions.find((a) => a.kind === 'choose-modes')
  const scry = actions.find((a) => a.kind === 'scry')
  const sacrifice = actions.find((a) => a.kind === 'sacrifice')
  const discard = actions.find((a) => a.kind === 'discard')
  const canPass = actions.some((a) => a.kind === 'pass-priority')

  const clearInteraction = () => {
    setTargeting(null)
    setXPrompt(null)
    setModePrompt(null)
    setPicks([])
  }

  // --- targeting -------------------------------------------------------
  const startTargeting = (
    label: string,
    specs: readonly string[],
    options: readonly (readonly TargetRef[])[],
    commit: (t: readonly TargetRef[]) => void,
  ) => {
    if (specs.length === 0) {
      commit([])
      return
    }
    setTargeting({ label, specs, options, picked: [], commit })
  }

  const pickTarget = (ref: TargetRef) => {
    if (!targeting) return
    const picked = [...targeting.picked, ref]
    if (picked.length < targeting.specs.length) {
      setTargeting({ ...targeting, picked })
      return
    }
    const commit = targeting.commit
    setTargeting(null)
    commit(picked)
  }

  // --- action starters ------------------------------------------------
  const beginCast = (cast: CastAction) => {
    if (cast.castModal) {
      setModePrompt({ cast, picked: [] })
      return
    }
    if (cast.xCost) {
      setXPrompt({ action: cast, value: cast.xCost.maxX })
      return
    }
    startTargeting(`Cast ${cast.cardName}`, cast.targetSpecs, cast.targetOptions, (targets) =>
      game.dispatch({
        type: 'cast-spell',
        player: YOU,
        card: cast.card,
        targets: [...targets],
        ...(cast.via !== undefined ? { via: cast.via } : {}),
        ...(cast.face !== undefined ? { face: cast.face } : {}),
      }),
    )
  }

  const beginAbility = (ab: AbilityAction, sac?: ObjectId) => {
    if (ab.xCost && sac === undefined && !ab.sacrifice) {
      setXPrompt({ action: ab, value: ab.xCost.maxX })
      return
    }
    if (ab.sacrifice && sac === undefined) {
      const choices = ab.sacrifice.choices
      if (choices.length === 1) {
        beginAbility(ab, choices[0])
        return
      }
      // pick via board click
      setTargeting({
        label: `${ab.cardName}: click a creature to sacrifice`,
        specs: ['(sacrifice)'],
        options: [choices.map((id) => ({ kind: 'object', object: id }) as TargetRef)],
        picked: [],
        commit: (t) => {
          const chosen = t[0]
          if (chosen?.kind === 'object') beginAbility(ab, chosen.object)
        },
      })
      return
    }
    startTargeting(ab.text || `${ab.cardName} ability`, ab.targetSpecs, ab.targetOptions, (targets) =>
      game.dispatch({
        type: 'activate-ability',
        player: YOU,
        source: ab.source,
        abilityIndex: ab.abilityIndex,
        targets: [...targets],
        ...(sac !== undefined ? { sacrifice: sac } : {}),
      }),
    )
  }

  const confirmX = () => {
    if (!xPrompt) return
    const { action, value } = xPrompt
    setXPrompt(null)
    if (action.kind === 'cast-spell') {
      startTargeting(`Cast ${action.cardName}`, action.targetSpecs, action.targetOptions, (targets) =>
        game.dispatch({
          type: 'cast-spell',
          player: YOU,
          card: action.card,
          targets: [...targets],
          xValue: value,
          ...(action.via !== undefined ? { via: action.via } : {}),
          ...(action.face !== undefined ? { face: action.face } : {}),
        }),
      )
    } else {
      startTargeting(action.text || action.cardName, action.targetSpecs, action.targetOptions, (targets) =>
        game.dispatch({
          type: 'activate-ability',
          player: YOU,
          source: action.source,
          abilityIndex: action.abilityIndex,
          targets: [...targets],
          xValue: value,
        }),
      )
    }
  }

  const confirmModes = () => {
    if (!modePrompt?.cast.castModal) return
    const { cast, picked } = modePrompt
    const modes = [...picked].sort((a, b) => a - b)
    setModePrompt(null)
    const chosen = modes.map((i) => cast.castModal!.modes[i])
    startTargeting(
      `Cast ${cast.cardName}`,
      chosen.flatMap((m) => m.targetSpecs),
      chosen.flatMap((m) => m.targetOptions),
      (targets) =>
        game.dispatch({
          type: 'cast-spell',
          player: YOU,
          card: cast.card,
          modes,
          targets: [...targets],
          ...(cast.face !== undefined ? { face: cast.face } : {}),
        }),
    )
  }

  // --- tile rendering ------------------------------------------------
  const slotOptions: readonly TargetRef[] = targeting
    ? (targeting.options[targeting.picked.length] ?? [])
    : []
  const targetableObj = (id: ObjectId) =>
    slotOptions.some((o) => o.kind === 'object' && o.object === id)
  const pickedObj = new Set(
    targeting?.picked.filter((r) => r.kind === 'object').map((r) => (r as { object: ObjectId }).object),
  )

  const clickTile = (obj: VisibleObject) => {
    if (targeting) {
      if (targetableObj(obj.id)) pickTarget({ kind: 'object', object: obj.id })
      return
    }
    if (sacrifice && sacrifice.eligible.includes(obj.id)) {
      setPicks((c) => (c.includes(obj.id) ? c.filter((x) => x !== obj.id) : [...c, obj.id]))
      return
    }
    if (!awaiting) {
      const abs = abilitiesBySource.get(obj.id)
      if (abs && abs.length === 1) beginAbility(abs[0])
    }
  }

  const renderTile = (obj: VisibleObject, ids: readonly ObjectId[] = [obj.id]) => {
    const abs = !awaiting && !targeting ? abilitiesBySource.get(obj.id) : undefined
    return (
      <div className="board-entry" key={obj.id}>
        <CardTile
          obj={obj}
          highlight={targeting ? targetableObj(obj.id) : Boolean(sacrifice?.eligible.includes(obj.id))}
          selected={pickedObj.has(obj.id) || picks.includes(obj.id)}
          activatable={Boolean(abs && abs.length > 0)}
          stackCount={ids.length > 1 ? ids.length : null}
          onClick={() => clickTile(obj)}
        />
        {abs && abs.length > 1 ? (
          <div className="lab-ability-menu">
            {abs.map((a) => (
              <button key={a.abilityIndex} type="button" onClick={() => beginAbility(a)}>
                <Symbols text={a.text} />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  const board = (pid: PlayerId) => {
    const entries = computeBoardEntries(view, pid)
    const rows = [
      entries.filter((e) => e.bucket !== 'land'),
      entries.filter((e) => e.bucket === 'land'),
    ]
    return (
      <div className={`lab-board ${pid === YOU ? 'you' : 'foe'}`}>
        {rows.map((row, i) => (
          <div className="board-row-cards" key={i}>
            {row.map((e) => renderTile(e.sample, e.ids))}
          </div>
        ))}
      </div>
    )
  }

  // --- controls -----------------------------------------------------
  let controls: ReactNode = null
  if (targeting) {
    const playerSlots = slotOptions.filter((o) => o.kind === 'player')
    const stackSlots = slotOptions.filter(
      (o) => o.kind === 'object' && view.zones.stack.includes(o.object),
    )
    controls = (
      <>
        <span>
          {targeting.label} — {targeting.specs[targeting.picked.length]} (
          {targeting.picked.length + 1}/{targeting.specs.length})
        </span>
        {playerSlots.map((o) =>
          o.kind === 'player' ? (
            <button key={o.player} type="button" onClick={() => pickTarget(o)}>
              {o.player === YOU ? 'You' : 'Opponent'}
            </button>
          ) : null,
        )}
        {stackSlots.map((o) =>
          o.kind === 'object' ? (
            <button key={o.object} type="button" onClick={() => pickTarget(o)}>
              {game.nameOf(o.object)} (stack)
            </button>
          ) : null,
        )}
        <button type="button" onClick={clearInteraction}>
          Cancel
        </button>
      </>
    )
  } else if (xPrompt) {
    const max = xPrompt.action.xCost?.maxX ?? 0
    controls = (
      <>
        <span>{xPrompt.action.cardName} — choose X (0–{max})</span>
        <input
          type="number"
          min={0}
          max={max}
          value={xPrompt.value}
          onChange={(e) =>
            setXPrompt({
              action: xPrompt.action,
              value: Math.max(0, Math.min(max, Math.floor(Number(e.target.value) || 0))),
            })
          }
          style={{ width: '4rem' }}
        />
        <button type="button" onClick={confirmX}>
          Confirm
        </button>
        <button type="button" onClick={clearInteraction}>
          Cancel
        </button>
      </>
    )
  } else if (modePrompt?.cast.castModal) {
    const cm = modePrompt.cast.castModal
    const toggle = (i: number) =>
      setModePrompt((p) =>
        p === null
          ? p
          : {
              ...p,
              picked: p.picked.includes(i)
                ? p.picked.filter((x) => x !== i)
                : p.picked.length >= cm.maxModes
                  ? [...p.picked.slice(1), i]
                  : [...p.picked, i],
            },
      )
    controls = (
      <>
        <span>
          {modePrompt.cast.cardName} — choose{' '}
          {cm.minModes === cm.maxModes ? cm.minModes : `${cm.minModes}–${cm.maxModes}`}
        </span>
        {cm.modes.map((m, i) => (
          <button
            key={i}
            type="button"
            className={modePrompt.picked.includes(i) ? 'selected' : undefined}
            disabled={m.targetOptions.some((o) => o.length === 0) && !modePrompt.picked.includes(i)}
            onClick={() => toggle(i)}
          >
            {m.text}
          </button>
        ))}
        <button
          type="button"
          disabled={modePrompt.picked.length < cm.minModes || modePrompt.picked.length > cm.maxModes}
          onClick={confirmModes}
        >
          Confirm
        </button>
        <button type="button" onClick={clearInteraction}>
          Cancel
        </button>
      </>
    )
  } else if (chooseModes && chooseModes.kind === 'choose-modes') {
    const cm = chooseModes
    const optional = cm.minModes === 0
    controls = (
      <>
        <span>
          {game.nameOf(cm.source)} — choose {cm.minModes === cm.maxModes ? cm.minModes : `${cm.minModes}–${cm.maxModes}`}
        </span>
        {cm.modeTexts.map((t, i) => (
          <button
            key={i}
            type="button"
            onClick={() => game.dispatch({ type: 'choose-modes', player: YOU, modes: [i] })}
          >
            {t}
          </button>
        ))}
        {optional ? (
          <button type="button" onClick={() => game.dispatch({ type: 'choose-modes', player: YOU, modes: [] })}>
            None
          </button>
        ) : null}
      </>
    )
  } else if (scry && scry.kind === 'scry') {
    controls = (
      <>
        <span>{scry.mode} — click cards to send to the bottom</span>
        {scry.cards.map((id) => (
          <button
            key={id}
            type="button"
            className={picks.includes(id) ? 'selected' : undefined}
            onClick={() =>
              setPicks((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
            }
          >
            {game.nameOf(id)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            game.dispatch({ type: 'scry', player: YOU, away: [...picks] })
            setPicks([])
          }}
        >
          Confirm
        </button>
      </>
    )
  } else if (sacrifice && sacrifice.kind === 'sacrifice') {
    controls = (
      <>
        <span>
          Sacrifice {sacrifice.count} — {picks.length}/{sacrifice.count} (click permanents)
        </span>
        <button
          type="button"
          disabled={picks.length !== sacrifice.count}
          onClick={() => {
            game.dispatch({ type: 'sacrifice', player: YOU, permanents: [...picks] })
            setPicks([])
          }}
        >
          Confirm
        </button>
      </>
    )
  } else if (discard && discard.kind === 'discard') {
    controls = (
      <>
        <span>Discard {discard.count}</span>
        {discard.from.map((id) => (
          <button
            key={id}
            type="button"
            className={picks.includes(id) ? 'selected' : undefined}
            onClick={() =>
              setPicks((c) =>
                c.includes(id) ? c.filter((x) => x !== id) : c.length >= discard.count ? c : [...c, id],
              )
            }
          >
            {game.nameOf(id)}
          </button>
        ))}
        <button
          type="button"
          disabled={picks.length !== discard.count}
          onClick={() => {
            game.dispatch({ type: 'discard', player: YOU, cards: [...picks] })
            setPicks([])
          }}
        >
          Confirm
        </button>
      </>
    )
  } else if (awaiting) {
    controls = (
      <span className="lab-note">
        The engine is waiting on a “{awaiting.kind}” decision that the lab doesn’t drive yet — use
        Reset.
      </span>
    )
  } else {
    controls = (
      <>
        {casts.map((c) => (
          <button key={`${c.card}:${c.face ?? 0}`} type="button" onClick={() => beginCast(c)}>
            Cast {c.cardName}
            {c.via ? ` (${c.via})` : ''}
          </button>
        ))}
        {lands.map((l) => (
          <button
            key={`${l.card}:${l.face ?? 0}`}
            type="button"
            onClick={() =>
              game.dispatch({
                type: 'play-land',
                player: YOU,
                card: l.card,
                ...(l.face !== undefined ? { face: l.face } : {}),
              })
            }
          >
            Play {game.nameOf(l.card)}
          </button>
        ))}
        {canPass ? (
          <button type="button" onClick={() => game.dispatch({ type: 'pass-priority', player: YOU })}>
            Pass / resolve
          </button>
        ) : null}
        <span className="lab-note">Click a permanent for its abilities.</span>
      </>
    )
  }

  const handIds = view.zones.hands[YOU] ?? []

  return (
    <div className="lab-sandbox">
      <div className="lab-sandbox-main">
        <div className="lab-side">
          <div className="lab-life">Opponent · {view.players[FOE]?.life} life</div>
          {board(FOE)}
          <div className="lab-mid">
            {view.zones.stack.length > 0 ? (
              <div className="lab-stack">
                Stack:{' '}
                {[...view.zones.stack]
                  .reverse()
                  .map((id) => game.nameOf(id))
                  .join(' → ')}
              </div>
            ) : (
              <div className="lab-stack empty">stack empty</div>
            )}
          </div>
          {board(YOU)}
          <div className="lab-life">
            You · {view.players[YOU]?.life} life · turn {view.turn.number} {view.turn.step}
          </div>
          <div className="lab-hand">
            {handIds.map((id) => {
              const obj = view.objects[id]
              if (!obj) return null
              const cast = casts.find((c) => c.card === id)
              const land = lands.find((l) => l.card === id)
              return (
                <CardTile
                  key={id}
                  obj={obj}
                  highlight={Boolean(cast || land)}
                  onClick={
                    cast ? () => beginCast(cast) : land ? () => game.dispatch({ type: 'play-land', player: YOU, card: id }) : undefined
                  }
                />
              )
            })}
          </div>
        </div>
        <div className="lab-log">
          <EventLog events={view.events} nameOf={game.nameOf} />
        </div>
      </div>
      <div className="lab-controls">
        {controls}
        <button type="button" className="lab-reset" onClick={() => { clearInteraction(); game.reset() }}>
          Reset
        </button>
      </div>
    </div>
  )
}
