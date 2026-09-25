import { defineCard } from "../define.js";

export default defineCard({
  name: "Desert Cerodon",
  manaCost: "{5}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 6,
  toughness: 4,
  cycling: { cost: "{R}" },
  text: "Cycling {R} ({R}, Discard this card: Draw a card.)",
});
