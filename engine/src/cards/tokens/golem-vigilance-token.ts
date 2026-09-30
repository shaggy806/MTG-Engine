import { defineCard } from "../define.js";

/** 3/3 colourless Golem artifact creature with vigilance — one of Triplicate
 * Titan's three. */
export default defineCard({
  name: "Golem Vigilance Token",
  art: "f27efb56-7fd4-4d0e-b641-a152b3ef8953",
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 3,
  toughness: 3,
  keywords: ["vigilance"],
  text: "Vigilance",
});
