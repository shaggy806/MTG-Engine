import { defineCard } from "../define.js";

/** 1/1 blue Faerie with flying — Faerie Formation's token. */
export default defineCard({
  name: "Faerie Token",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Faerie"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying",
});
