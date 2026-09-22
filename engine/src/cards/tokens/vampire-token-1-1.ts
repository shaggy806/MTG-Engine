import { defineCard } from "../define.js";

// A 1/1 black Vampire — Edgar Markov's Eminence token. Distinct from
// "Vampire Token", which is Bloodline Keeper's 2/2 flier; the size-in-the-name
// convention follows "3/3 Beast Token".
export default defineCard({
  name: "1/1 Vampire Token",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 1,
  toughness: 1,
});
