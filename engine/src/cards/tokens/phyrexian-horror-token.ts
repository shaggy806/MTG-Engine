import { defineCard } from "../define.js";

/** X/1 red Phyrexian Horror with trample and haste — Urabrask's Forge's token.
 * Its printed power is a star: the effect that makes it sets its base P/T
 * (`basePt`). */
export default defineCard({
  name: "Phyrexian Horror Token",
  art: "da13c90f-9ed2-4262-88e2-17daa294537b",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Horror"],
  power: 0,
  toughness: 1,
  keywords: ["trample", "haste"],
  text: "Trample, haste",
});
