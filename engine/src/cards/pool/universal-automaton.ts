import { defineCard } from "../define.js";

export default defineCard({
  name: "Universal Automaton",
  manaCost: "{1}",
  types: ["artifact", "creature"],
  subtypes: ["Shapeshifter"],
  power: 1,
  toughness: 1,
  keywords: ["changeling"],
  text: "Changeling (This card is every creature type.)",
});
