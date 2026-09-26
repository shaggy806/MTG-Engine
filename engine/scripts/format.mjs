// Pretty-prints a game's event log, for the fuzzer's `--log` (random-demo.mjs).

export const makeFormatter = (game) => {
  const name = (id) => {
    const o = game.state.objects[id];
    if (o === undefined) return id;
    const faces = o.faces;
    return faces && faces.length > 1 ? (faces[o.face ?? 0] ?? o.cardName) : o.cardName;
  };
  const target = (t) =>
    t.kind === "player" ? t.player : name(t.object);
  // Where a card was played or cast from — said only when it isn't the hand.
  const fromZone = (zone) =>
    zone === undefined || zone === "hand"
      ? ""
      : ` from ${zone === "command" ? "the command zone" : zone}`;

  const describe = (e) => {
    switch (e.type) {
      case "game-started":
        return `players=${e.players.join(", ")}  starting=${e.startingPlayer}  seed=${e.seed}`;
      case "turn-began":
        return `turn ${e.turn} — ${e.activePlayer}${e.extra ? " (extra turn)" : ""}`;
      case "extra-turn-queued":
        return `${e.player} takes an extra turn after this one`;
      case "additional-combat-queued":
        return `${e.player} gets an additional combat phase`;
      case "additional-combat-phase":
        return `additional combat phase`;
      case "spell-copied":
        return `${e.controller} copies ${name(e.original)}`;
      case "lore-counter-added":
        return `${name(e.object)} — lore counter ${e.lore}`;
      case "saga-completed":
        return `${name(e.object)} has finished its final chapter`;
      case "chapter-resolved":
        return `${name(e.saga)}'s ${e.final ? "final " : ""}chapter ability resolves`;
      case "permanent-transformed":
        return `${name(e.object)} transforms (now ${e.front ? "front" : "back"} face)`;
      case "day-night-changed":
        return `it becomes ${e.value}`;
      case "counter-failed":
        return `${name(e.object)} can't be countered`;
      case "monarch-changed":
        return e.via === "monarch-left"
          ? `${e.player} becomes the monarch (the monarch left the game)`
          : `${e.player} becomes the monarch (${e.via})`;
      case "energy-changed":
        return `${e.player} ${e.delta >= 0 ? "+" : ""}${e.delta} energy (now ${e.energy})`;
      case "player-counters-changed":
        return `${e.player} ${e.delta >= 0 ? "+" : ""}${e.delta} ${e.counter} (now ${e.total})`;
      case "emblem-created":
        return `${e.player} gets an emblem — "${e.text}"`;
      case "card-on-adventure":
        return `${name(e.object)} goes on an adventure (exiled)`;
      case "cascade-revealed":
        return e.cast
          ? `${e.player} cascades into ${name(e.cast)} (${e.exiled.length} exiled)`
          : `${e.player} cascades — nothing to cast (${e.exiled.length} exiled)`;
      case "step-began":
        return `[${e.phase}] ${e.step}`;
      case "priority-received":
        return `→ ${e.player}`;
      case "priority-passed":
        return `${e.player} passes`;
      case "permanent-untapped":
        return name(e.object);
      case "permanent-tapped":
        return name(e.object);
      case "mana-added":
        return `${e.player} +{${e.mana}}`;
      case "card-drawn":
        return `${e.player} draws ${name(e.object)}`;
      case "draw-from-empty-library":
        return `${e.player} draws from an empty library!`;
      case "cards-discarded":
        return `${e.player} discards ${e.objects.map(name).join(", ")}`;
      case "cards-revealed":
        return `${e.player} reveals ${e.objects.map(name).join(", ")} from their ${e.from}`;
      case "cards-chosen-from-zone":
        return e.objects.length > 0
          ? `${e.player} takes ${e.objects.map(name).join(", ")}`
          : `${e.player} takes nothing`;
      case "library-shuffled":
        return `${e.player} shuffles their library`;
      case "scried":
        return `${e.player} ${e.mode}s ${e.looked} (${e.movedAway} ${
          e.mode === "surveil" ? "to graveyard" : "to bottom"
        })`;
      case "proliferated":
        return e.count > 0
          ? `${e.player} proliferates (${e.count})`
          : `${e.player} proliferates nothing`;
      case "damage-cleared":
        return `${e.objects.length} permanent(s)`;
      case "land-played":
        return `${e.player} plays ${name(e.object)}${fromZone(e.from)}`;
      case "spell-cast":
        return `${e.player} casts ${name(e.object)}${fromZone(e.from)}${
          e.via ? ` (${e.via})` : ""
        }${e.x != null ? ` (X=${e.x})` : ""}${
          e.targets.length ? ` at ${e.targets.map(target).join(", ")}` : ""
        }`;
      case "spell-resolved":
        return `${name(e.object)} resolves`;
      case "flashback-granted":
        return `${name(e.object)} gains flashback ${e.cost}`;
      case "graveyard-cast-granted":
        return `${e.player} may cast ${name(e.object)} from the graveyard this turn`;
      case "flashback-grant-expired":
        return `${name(e.object)}'s flashback grant expires`;
      case "card-suspended":
        return `${e.player} suspends ${name(e.object)} (${e.timeCounters} time counter${
          e.timeCounters === 1 ? "" : "s"
        })`;
      case "time-counter-removed":
        return `${name(e.object)} — time counter removed (${e.remaining} left)`;
      case "card-foretold":
        return `${e.player} foretells a card`;
      case "card-cycled":
        return `${e.player} cycles ${name(e.object)}`;
      case "escape-cost-paid":
        return `${name(e.object)} escapes (exiling ${e.exiled.length} cards)`;
      case "ability-activated":
        return `${e.player} activates ${name(e.source)}'s ability${
          e.onStack ? "" : " (mana)"
        }`;
      case "ability-resolved":
        return `${name(e.source)}'s ability resolves`;
      case "object-targeted":
        return `${name(e.object)} becomes the target of ${name(e.source)} (${e.by})`;
      case "ability-triggered":
        return `${name(e.source)}'s trigger goes on the stack (${e.controller})`;
      case "trigger-removed":
        return `${name(e.source)}'s trigger removed — ${e.reason}`;
      case "pt-modified":
        return `${name(e.object)} ${e.power >= 0 ? "+" : ""}${e.power}/${
          e.toughness >= 0 ? "+" : ""
        }${e.toughness}${e.duration === "end-of-turn" ? " until EOT" : ""}`;
      case "counter-added":
        return `${name(e.object)} gets ${e.amount} ${e.counter} counter(s)`;
      case "counter-removed":
        return `${name(e.object)} loses ${e.amount} ${e.counter} counter(s)`;
      case "keyword-granted":
        return `${name(e.object)} gains ${e.keyword}${
          e.duration === "end-of-turn" ? " until EOT" : ""
        }`;
      case "prohibition-imposed": {
        const what = [e.spells ? `cast ${e.spellsLabel ?? "spells"}` : null, e.abilities ? "activate abilities" : null]
          .filter((w) => w !== null)
          .join(" or ");
        return e.object !== undefined
          ? `${name(e.object)}'s activated abilities can't be activated this turn`
          : `${e.players.join(", ")} can't ${what} this turn`;
      }
      case "restrictions-imposed": {
        const what = e.restrictions.map((r) => r.replaceAll("-", " ")).join(" and ");
        return e.object === undefined
          ? `${e.player}: for the rest of the turn, affected creatures: ${what}`
          : `${name(e.object)}: ${what} this turn`;
      }
      case "pt-modifier-expired":
        return `${e.objects.map(name).join(", ")} — modifiers wear off`;
      case "permanent-animated":
        return `${name(e.object)} becomes a ${e.power}/${e.toughness} creature${
          e.duration === "end-of-turn" ? " until EOT" : ""
        }`;
      case "types-added":
        return `${name(e.object)} becomes ${[...e.subtypes, ...e.types].join(" ")} in addition to its other types${
          e.duration === "end-of-turn" ? " until EOT" : ""
        }`;
      case "text-changed":
        return `${name(e.object)}: text "${e.from}" → "${e.to}"`;
      case "attacker-declared":
        return `${name(e.attacker)} attacks ${name(e.defender)}`;
      case "attackers-declared":
        return `${e.player} attacks with ${e.attackers.length}`;
      case "attacked-alone":
        return `${name(e.attacker)} attacked alone`;
      case "cards-put-into-graveyard":
        return `${e.arrivals.map((a) => name(a.object)).join(", ")} put into a graveyard`;
      case "coin-flipped":
        return `${e.player} ${e.won ? "wins" : "loses"} a coin flip`;
      case "cards-put-into-exile":
        return `${e.arrivals.map((a) => name(a.object)).join(", ")} put into exile`;
      case "player-attacked":
        return `${e.player} attacks ${e.defender} with ${e.attackers.length}`;
      case "loyalty-changed":
        return `${name(e.object)} ${e.delta >= 0 ? "+" : ""}${e.delta} loyalty (now ${e.loyalty})`;
      case "blocker-declared":
        return `${name(e.blocker)} blocks ${name(e.attacker)}`;
      case "attacker-blocked":
        return `${name(e.attacker)} is blocked by ${e.blockers.length}`;
      case "spell-fizzled":
        return `${name(e.object)} fizzles — ${e.reason}`;
      case "spell-countered":
        return `${name(e.object)} is countered`;
      case "spell-exiled":
        return `${name(e.object)} is exiled from the stack`;
      case "ward-paid":
        return `${e.player} pays ward for ${name(e.object)}`;
      case "ward-unpaid":
        return `${e.player} doesn't pay ward for ${name(e.object)}`;
      case "control-changed":
        return `${e.controller} gains control of ${name(e.object)}${
          e.untilEndOfTurn ? " until EOT" : ""
        }`;
      case "permanent-copied":
        return e.copyOf
          ? `${name(e.object)} enters as a copy of ${e.copyOf}`
          : `${name(e.object)} copies nothing`;
      case "creature-type-chosen":
        return `${name(e.object)} chooses ${e.creatureType}`;
      case "permanent-entered-battlefield":
        return `${name(e.object)} enters the battlefield`;
      case "permanent-left-battlefield":
        return `${name(e.object)} leaves the battlefield → ${e.toZone}`;
      case "permanent-attached":
        return `${name(e.source)} attaches to ${name(e.target)}`;
      case "damage-dealt":
        return `${name(e.source)} deals ${e.amount} to ${target(e.target)}`;
      case "life-changed":
        return `${e.player} ${e.delta >= 0 ? "+" : ""}${e.delta} life (now ${e.life})`;
      case "permanent-destroyed":
        return `${name(e.object)} destroyed — ${e.reason}`;
      case "permanent-destroy-prevented":
        return `${name(e.object)} not destroyed — ${e.reason}`;
      case "combat-damage-prevention-set":
        return `all combat damage is prevented this turn`;
      case "damage-prevented":
        return `${name(e.source)}'s ${e.amount} damage to ${target(e.target)} is prevented`;
      case "graveyard-replaced-with-exile":
        return `${name(e.object)} is exiled instead of going to a graveyard`;
      case "leave-replaced-with-exile":
        return `${name(e.object)} is exiled instead of going to ${e.intendedZone === "hand" ? "a hand" : e.intendedZone === "library" ? "a library" : `the ${e.intendedZone}`}`;
      case "prevention-shield-created":
        return `a shield prevents the next ${e.amount} damage to ${target(e.target)}`;
      case "draw-redirected":
        return `${e.from}'s draw is redirected — ${e.to} draws instead`;
      case "modes-chosen": {
        const who = e.player === undefined ? "" : `${e.player} `;
        return e.modes.length > 0
          ? `${name(e.source)} — ${who}chose mode(s) ${e.modes.map((m) => m + 1).join(", ")}`
          : `${name(e.source)} — ${who}declined`;
      }
      case "permanent-returned-to-hand":
        return `${name(e.object)} returns to ${e.owner}'s hand`;
      case "permanent-exiled":
        return `${name(e.object)} is exiled`;
      case "permanent-sacrificed":
        return `${e.player} sacrifices ${name(e.object)}`;
      case "cards-milled":
        return `${e.player} mills ${e.objects.map(name).join(", ")}`;
      case "cards-left-graveyard":
        return `${e.objects.map(name).join(", ")} ${e.objects.length === 1 ? "leaves" : "leave"} the graveyard`;
      case "player-lost":
        return `${e.player}: ${e.reason}`;
      case "game-ended":
        return e.winner ? `${e.winner} wins — ${e.reason}` : `draw — ${e.reason}`;
      case "mulligan-taken":
        return `${e.player} mulligans (#${e.count})`;
      case "hand-kept":
        return e.mulligans > 0
          ? `${e.player} keeps, after ${e.mulligans} mulligan(s)`
          : `${e.player} keeps their opening hand`;
      case "cards-put-on-bottom":
        return `${e.player} puts ${e.objects.map(name).join(", ")} on the bottom of their library`;
      case "commander-zone-decision": {
        // A graveyard or exile it's already in (rule 903.9a); a hand or
        // library it hasn't reached (903.9b).
        const there = e.from === "graveyard" || e.from === "exile";
        const zone = e.from === "exile" ? "exile" : `the ${e.from}`;
        if (e.toCommandZone) {
          return there
            ? `${name(e.object)} goes to the command zone from ${zone}`
            : `${name(e.object)} goes to the command zone instead of ${zone}`;
        }
        return there
          ? `${name(e.object)} stays in ${zone}`
          : `${name(e.object)} goes to its owner's ${e.from}`;
      }
      default:
        return JSON.stringify(e);
    }
  };

  return { describe };
};

export const printLog = (game, { since = 0 } = {}) => {
  const { describe } = makeFormatter(game);
  for (const e of game.events.slice(since)) {
    console.log(
      `#${String(e.seq).padStart(4)}  ${e.type.padEnd(28)} ${describe(e)}`,
    );
  }
};

export const printSummary = (game) => {
  console.log("");
  console.log(`events: ${game.events.length}`);
  console.log(`turns:  ${game.state.turn.number}`);
  console.log(
    `result: ${
      game.isOver
        ? `${game.winner ?? "draw"} — ${game.state.result.reason}`
        : "in progress"
    }`,
  );
  for (const p of game.state.turnOrder) {
    const ps = game.state.players[p];
    const board = game.battlefield
      .filter((id) => game.state.objects[id].controller === p)
      .map((id) => game.state.objects[id].cardName);
    console.log(
      `  ${p}: ${ps.life} life · hand ${game.handOf(p).length} · library ${
        game.libraryOf(p).length
      } · graveyard ${game.graveyardOf(p).length}${
        board.length ? ` · board [${board.join(", ")}]` : ""
      }`,
    );
  }
};
