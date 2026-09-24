import { defineCard } from "../define.js";

// A 2/2 Elemental that's all colors — The Wandering Minstrel's token.
// ("Elemental Token" is the 1/1 red one with haste; the engine keys tokens by
// name, so this needs its own.)
export default defineCard({
  name: "Elemental Token (All Colors)",
  art: "fe592a5c-5e6e-40ed-8818-f4651bcf2fe8",
  colors: ["W", "U", "B", "R", "G"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 2,
  toughness: 2,
});
