import { defineCard } from "../define.js";

export default defineCard({
  name: "Rejuvenate",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["sorcery"],
  cycling: { cost: "{2}" },
  text: "You gain 6 life.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  effect: { kind: "gain-life", amount: 6 },
});
