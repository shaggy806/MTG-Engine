import { defineCard } from "../define.js";

export default defineCard({
  name: "Wasteland Scorpion",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Scorpion"],
  power: 2,
  toughness: 2,
  keywords: ["deathtouch"],
  cycling: { cost: "{2}" },
  text: "Deathtouch\nCycling {2} ({2}, Discard this card: Draw a card.)",
});
