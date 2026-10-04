import { defineCard } from "../define.js";

// Edgar, Charmed Groom // Edgar Markov's Coffin's Vampire token: a 1/1 white
// and black Vampire with lifelink (Lifelink Vampire Token is white only).
export default defineCard({
  name: "Vampire Token (Edgar, Charmed Groom // Edgar Markov's Coffin)",
  art: "7eee78d3-c65f-4454-bd3c-1c55388422f5",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 1,
  toughness: 1,
  keywords: ["lifelink"],
  text: "Lifelink",
});
