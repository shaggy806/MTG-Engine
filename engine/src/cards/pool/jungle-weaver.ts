import { defineCard } from "../define.js";

export default defineCard({
  name: "Jungle Weaver",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spider"],
  power: 5,
  toughness: 6,
  keywords: ["reach"],
  cycling: { cost: "{2}" },
  text: "Reach (This creature can block creatures with flying.)\nCycling {2} ({2}, Discard this card: Draw a card.)",
});
