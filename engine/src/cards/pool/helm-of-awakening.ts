import { defineCard } from "../define.js";

const TEXT = "Spells cost {1} less to cast.";

// Every player's spells — generic mana only (rule 601.2f).
export default defineCard({
  name: "Helm of Awakening",
  manaCost: "{2}",
  types: ["artifact"],
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: {}, reduceGeneric: 1 },
      text: TEXT,
    },
  ],
});
