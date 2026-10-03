import { defineCard } from "../define.js";

/**
 * Murmuration's token: a 1/2 blue Bird with flying *named* Storm Crow. The
 * registry is keyed by name and "Storm Crow" is already the real card (whose
 * {1}{U} mana cost a token mustn't have), so it's defined under a " Token"
 * key and named Storm Crow in the game by `tokenName`.
 */
export default defineCard({
  name: "Storm Crow Token",
  tokenName: "Storm Crow",
  art: "d4498fac-e345-4cea-8d7e-7e0759600f33",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying",
});
