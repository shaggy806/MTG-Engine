import { defineCard } from "../define.js";

const DRAW_TEXT = "Whenever you draw a card, put a foreshadow counter on this enchantment.";
const KRAKEN_TEXT = "Remove eight foreshadow counters from this enchantment: Create an 8/8 blue Kraken creature token.";

export default defineCard({
  name: "Ominous Seas",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: `${DRAW_TEXT}\n${KRAKEN_TEXT}\nCycling {2} ({2}, Discard this card: Draw a card.)`,
  cycling: { cost: "{2}" },
  triggered: [
    {
      trigger: { on: "draws", who: "you" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "foreshadow", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, removeCounter: { kind: "foreshadow", count: 8 } },
      targets: [],
      effect: { kind: "create-token", token: "Kraken Token", count: 1 },
      resolve: null,
      text: KRAKEN_TEXT,
    },
  ],
});
