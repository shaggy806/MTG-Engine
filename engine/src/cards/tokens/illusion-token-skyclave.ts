import { defineCard } from "../define.js";

// Skyclave Apparition's X/X blue Illusion: it prints 0/0 and gets its size
// from `create-token`'s `basePt` as it's made.
export default defineCard({
  name: "Illusion Token (Skyclave Apparition)",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Illusion"],
  power: 0,
  toughness: 0,
  text: "",
});
