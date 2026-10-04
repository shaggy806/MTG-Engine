import { defineCard } from "../define.js";

/** 1/1 red Goblin with haste — Goblin Rabblemaster's token. */
export default defineCard({
  name: "Goblin Token (Haste)",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 1,
  toughness: 1,
  keywords: ["haste"],
  text: "Haste",
});
