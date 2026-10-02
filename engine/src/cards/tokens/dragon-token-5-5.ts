import { defineCard } from "../define.js";

/** 5/5 red Dragon with flying — Lathliss, Dragon Queen's token. */
export default defineCard({
  name: "Dragon Token",
  art: "2ec9eae0-2c0b-4225-8fa5-96f04a239d47",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying",
});
