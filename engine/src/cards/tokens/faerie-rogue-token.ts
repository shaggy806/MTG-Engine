import { defineCard } from "../define.js";

/** 1/1 black Faerie Rogue with flying — Alela, Cunning Conqueror's token.
 * ("Faerie Token" is the blue Faerie Formation makes.) */
export default defineCard({
  name: "Faerie Rogue Token",
  art: "d680c3f1-a3c0-4f38-8958-2402612c8dd1",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Faerie", "Rogue"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying",
});
