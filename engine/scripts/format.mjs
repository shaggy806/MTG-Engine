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
        return `turn ${e.turn} — ${e.activePlayer}`;
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
      case "damage-cleared":
        return `${e.objects.length} permanent(s)`;
      case "land-played":
        return `${e.player} plays ${name(e.object)}`;
      case "spell-cast":
        return `${e.player} casts ${name(e.object)}${
          e.targets.length ? ` at ${e.targets.map(target).join(", ")}` : ""
        }`;
      case "spell-resolved":
        return `${name(e.object)} resolves`;
      case "spell-fizzled":
        return `${name(e.object)} fizzles — ${e.reason}`;
      case "permanent-entered-battlefield":
        return `${name(e.object)} enters the battlefield`;
      case "damage-dealt":
        return `${name(e.source)} deals ${e.amount} to ${target(e.target)}`;
      case "life-changed":
        return `${e.player} ${e.delta >= 0 ? "+" : ""}${e.delta} life (now ${e.life})`;
      case "permanent-destroyed":
        return `${name(e.object)} destroyed — ${e.reason}`;
      case "player-lost":
        return `${e.player}: ${e.reason}`;
      case "game-ended":
        return e.winner ? `${e.winner} wins — ${e.reason}` : `draw — ${e.reason}`;
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
