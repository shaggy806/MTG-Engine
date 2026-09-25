import { defineCard } from "../define.js";

export default defineCard({
  name: "Fuel the Flames",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  cycling: { cost: "{2}" },
  text: "Fuel the Flames deals 2 damage to each creature.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  effect: { kind: "damage-all", amount: 2, filter: { type: "creature" } },
});
