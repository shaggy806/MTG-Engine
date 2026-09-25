import { defineCard } from "../define.js";

export default defineCard({
  name: "Starstorm",
  manaCost: "{X}{R}{R}",
  colors: ["R"],
  types: ["instant"],
  cycling: { cost: "{3}" },
  text: "Starstorm deals X damage to each creature.\nCycling {3} ({3}, Discard this card: Draw a card.)",
  effect: { kind: "damage-all", amount: "x", filter: { type: "creature" } },
});
