import { defineCard } from "../define.js";

// A 3/3 green Beast — Garruk Wildspeaker's token. ("Beast Token" is the 4/4
// one Rampaging Baloths makes; the engine keys tokens by name so this needs
// its own.)
export default defineCard({
  name: "3/3 Beast Token",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 3,
  toughness: 3,
});
