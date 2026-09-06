import { defineCard } from "../define.js";

export default defineCard({
  name: "Oracle of Mul Daya",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 2,
  toughness: 2,
  text: "Play with the top card of your library revealed.",
  revealsOwnLibraryTop: true,
});
