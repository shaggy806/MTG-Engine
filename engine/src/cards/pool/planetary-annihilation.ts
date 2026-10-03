import { defineCard } from "../define.js";

// Every player's choice is made before anyone sacrifices, and the lands go
// at once (an edict's queue); only then is the damage dealt.
export default defineCard({
  name: "Planetary Annihilation",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text:
    "Each player chooses six lands they control, then sacrifices the rest. Planetary Annihilation deals 6 damage to each creature.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "sacrifice-all-but", who: "each-player", keep: 6, filter: { type: "land" } },
      { kind: "damage-all", filter: { type: "creature" }, amount: 6 },
    ],
  },
});
