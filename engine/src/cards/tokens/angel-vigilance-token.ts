import { defineCard } from "../define.js";

/** 4/4 white Angel with flying and vigilance — Resplendent Angel's token.
 * ("4/4 Angel Token" is the one with flying only.) */
export default defineCard({
  name: "4/4 Vigilant Angel Token",
  art: "1a0d80ce-9397-4c6d-9a07-31172d46f42a",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "vigilance"],
  text: "Flying, vigilance",
});
