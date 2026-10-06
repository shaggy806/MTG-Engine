import { defineCard } from "../define.js";

// Rulings:
//   [2009-10-01] The ability triggers whenever any player, not just you, casts a black spell.

const TEXT = "Whenever a player casts a black spell, you may gain 1 life.";

export default defineCard({
  name: "Demon's Horn",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "any", filter: { colors: ["B"] } },
      targets: [],
      effect: { kind: "may", prompt: "Gain 1 life?", effect: { kind: "gain-life", amount: 1 } },
      resolve: null,
      text: TEXT,
    },
  ],
});
