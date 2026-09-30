import { defineCard } from "../define.js";

/** 1/1 blue and black Faerie with flying — Bitterbloom Bearer's token.
 * ("Faerie Token" is the blue one, "Faerie Rogue Token" the black Rogue.) */
export default defineCard({
  name: "Blue-Black Faerie Token",
  art: "01524db2-c96f-4902-8394-bc7a7128e573",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Faerie"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying",
});
