import { defineCard } from "../define.js";

// The 1/1 black and green Insect (Grist, the Hunger Tide's) — distinct from
// Scute Swarm's mono-green one, so a card naming "black and green" gets the
// right colours for protection and colour counts.
export default defineCard({
  name: "Insect Token (Black-Green)",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 1,
  toughness: 1,
});
