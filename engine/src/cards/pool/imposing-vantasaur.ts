import { defineCard } from "../define.js";

export default defineCard({
  name: "Imposing Vantasaur",
  manaCost: "{5}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 3,
  toughness: 6,
  keywords: ["vigilance"],
  cycling: { cost: "{1}" },
  text: "Vigilance\nCycling {1} ({1}, Discard this card: Draw a card.)",
});
