// Shared pretty-printing for the playground scripts.

export const makeFormatter = (game) => {
  const name = (id) => game.state.objects[id]?.cardName ?? id;
  const target = (t) =>
    t.kind === "player" ? t.player : name(t.object);

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
      case "damage-cleared":
        return `${e.objects.length} permanent(s)`;
      case "land-played":
        return `${e.player} plays ${name(e.object)}`;
      case "spell-cast":
        return `${e.player} casts ${name(e.object)}${
          e.via ? ` (${e.via})` : ""
        }${e.x != null ? ` (X=${e.x})` : ""}${
          e.targets.length ? ` at ${e.targets.map(target).join(", ")}` : ""
        }`;
      case "spell-resolved":
        return `${name(e.object)} resolves`;
      case "flashback-granted":
        return `${name(e.object)} gains flashback ${e.cost}`;
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
      case "escape-cost-paid":
        return `${name(e.object)} escapes (exiling ${e.exiled.length} cards)`;
      case "ability-activated":
        return `${e.player} activates ${name(e.source)}'s ability${
          e.onStack ? "" : " (mana)"
        }`;
      case "ability-resolved":
        return `${name(e.source)}'s ability resolves`;
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
      case "pt-modifier-expired":
        return `${e.objects.map(name).join(", ")} — modifiers wear off`;
      case "permanent-animated":
        return `${name(e.object)} becomes a ${e.power}/${e.toughness} creature${
          e.duration === "end-of-turn" ? " until EOT" : ""
        }`;
      case "text-changed":
        return `${name(e.object)}: text "${e.from}" → "${e.to}"`;
      case "attacker-declared":
        return `${name(e.attacker)} attacks ${name(e.defender)}`;
      case "loyalty-changed":
        return `${name(e.object)} ${e.delta >= 0 ? "+" : ""}${e.delta} loyalty (now ${e.loyalty})`;
      case "blocker-declared":
        return `${name(e.blocker)} blocks ${name(e.attacker)}`;
      case "spell-fizzled":
        return `${name(e.object)} fizzles — ${e.reason}`;
      case "spell-countered":
        return `${name(e.object)} is countered`;
      case "ward-paid":
        return `${e.player} pays ward for ${name(e.object)}`;
      case "control-changed":
        return `${e.controller} gains control of ${name(e.object)}${
          e.untilEndOfTurn ? " until EOT" : ""
        }`;
      case "permanent-copied":
        return e.copyOf
          ? `${name(e.object)} enters as a copy of ${e.copyOf}`
          : `${name(e.object)} copies nothing`;
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
      case "modes-chosen":
        return e.modes.length > 0
          ? `${name(e.source)} — mode(s) ${e.modes.map((m) => m + 1).join(", ")}`
          : `${name(e.source)} — declined`;
      case "permanent-returned-to-hand":
        return `${name(e.object)} returns to ${e.owner}'s hand`;
      case "permanent-exiled":
        return `${name(e.object)} is exiled`;
      case "permanent-sacrificed":
        return `${e.player} sacrifices ${name(e.object)}`;
      case "cards-milled":
        return `${e.player} mills ${e.objects.map(name).join(", ")}`;
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
      case "commander-zone-decision":
        return e.toCommandZone
          ? `${name(e.object)} goes to the command zone (from ${e.from})`
          : `${name(e.object)} stays in the ${e.from}`;
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
