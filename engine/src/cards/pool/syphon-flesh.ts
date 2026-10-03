import { defineCard } from "../define.js";

// The Zombies wait for every edict to be answered (the sequence suspends on
// the sacrifice decisions), and count only creatures actually sacrificed —
// an opponent with no creature adds none.
export default defineCard({
  name: "Syphon Flesh",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Each other player sacrifices a creature of their choice. You create a 2/2 black Zombie creature token for each creature sacrificed this way.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "sacrifice", who: "each-opponent", filter: { type: "creature" }, count: 1 },
      { kind: "create-token", token: "Zombie Token", count: { thisWay: "sacrificed" } },
    ],
  },
});
