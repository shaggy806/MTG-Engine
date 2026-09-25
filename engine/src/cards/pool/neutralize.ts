import { defineCard } from "../define.js";

export default defineCard({
  name: "Neutralize",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  cycling: { cost: "{2}" },
  text: "Counter target spell.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  targets: ["spell"],
  effect: { kind: "counter", target: 0 },
});
