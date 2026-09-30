import { defineCard } from "../define.js";

// Every creature that attacked this turn untaps, whoever controls it. The
// extra combat and main phase come only if it resolves in a main phase
// (`additional-combat`, its ruling).
export default defineCard({
  name: "Relentless Assault",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text:
    "Untap all creatures that attacked this turn. After this main phase, there is an additional combat phase followed by an additional main phase.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "untap-all", filter: { type: "creature", attackedThisTurn: true } },
      { kind: "additional-combat" },
    ],
  },
});
