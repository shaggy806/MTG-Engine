import { defineCard } from "../define.js";

/** 5/5 red Dragon with flying — Lathliss, Dragon Queen's token. */
export default defineCard({
  name: "Dragon Token",
  art: "https://scryfall.com/card/tm21/5/dragon",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying",
});
