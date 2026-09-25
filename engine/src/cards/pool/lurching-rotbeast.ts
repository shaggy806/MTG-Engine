import { defineCard } from "../define.js";

export default defineCard({
  name: "Lurching Rotbeast",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Beast"],
  power: 4,
  toughness: 2,
  cycling: { cost: "{B}" },
  text: "Cycling {B} ({B}, Discard this card: Draw a card.)",
});
