import { defineCard } from "../define.js";

const CAST_TEXT = "Whenever you cast an enchantment spell, create a 4/4 white Angel creature token with flying.";

export default defineCard({
  name: "Sigil of the Empty Throne",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: CAST_TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "enchantment" } },
      targets: [],
      effect: { kind: "create-token", token: "4/4 Angel Token", count: 1 },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
