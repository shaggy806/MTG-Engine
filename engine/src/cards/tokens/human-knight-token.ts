import { defineCard } from "../define.js";

/** 2/2 red Human Knight with trample and haste — Éowyn, Shieldmaiden's token. */
export default defineCard({
  name: "Human Knight Token",
  art: "491fc1c3-a46e-4cfd-a749-57f4c96f6aea",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 2,
  keywords: ["trample", "haste"],
  text: "Trample, haste",
});
