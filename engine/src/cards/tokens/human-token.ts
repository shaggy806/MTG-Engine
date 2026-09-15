import { defineCard } from "../define.js";

// A 1/1 white Human — Stroke of Midnight's token.
export default defineCard({
  name: "Human Token",
  art: "https://scryfall.com/card/tznr/5/human",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human"],
  power: 1,
  toughness: 1,
});
