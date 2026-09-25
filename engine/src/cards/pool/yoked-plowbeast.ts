import { defineCard } from "../define.js";

export default defineCard({
  name: "Yoked Plowbeast",
  manaCost: "{5}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 5,
  toughness: 5,
  cycling: { cost: "{2}" },
  text: "Cycling {2} ({2}, Discard this card: Draw a card.)",
});
