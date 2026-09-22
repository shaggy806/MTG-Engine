import { defineCard } from "../define.js";

// A 1/1 green Cat — Rin and Seri, Inseparable's Dog-spell token. ("Cat Token"
// is the 2/2 white one Ajani, Caller of the Pride makes; the engine keys
// tokens by name, so a different body needs a different name.)
export default defineCard({
  name: "1/1 Green Cat Token",
  art: "fbdf8dc1-1b10-4fce-97b9-1f5600500cc1",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Cat"],
  power: 1,
  toughness: 1,
});
