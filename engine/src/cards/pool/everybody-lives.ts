import { defineCard } from "../define.js";

// The creatures are the ones on the battlefield as it resolves (rule
// 611.2c); the players' effects bind every player still in the game. "Can't
// lose life" (rule 119.8) stops damage and "lose life" changing a total and
// makes any cost that pays life (more than 0) unpayable, all until this
// turn's cleanup. Conceding still loses (the ruling).
export default defineCard({
  name: "Everybody Lives!",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "All creatures gain hexproof and indestructible until end of turn. Players gain hexproof until end of turn. " +
    "Players can't lose life this turn and players can't lose the game or win the game this turn.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "grant-keyword-all", filter: { type: "creature" }, keyword: "hexproof", duration: "end-of-turn" },
      { kind: "grant-keyword-all", filter: { type: "creature" }, keyword: "indestructible", duration: "end-of-turn" },
      { kind: "grant-player-hexproof", who: "each-player" },
      {
        kind: "player-effect",
        duration: "end-of-turn",
        cantLoseLife: "each-player",
        cantLoseGame: "each-player",
        cantWinGame: "each-player",
      },
    ],
  },
});
