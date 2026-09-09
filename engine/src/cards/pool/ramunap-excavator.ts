import { defineCard } from "../define.js";

export default defineCard({
  name: "Ramunap Excavator",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Snake", "Cleric"],
  power: 2,
  toughness: 3,
  text: "You may play lands from your graveyard.",
  static: [
    {
      affects: { scope: "self" },
      playFromGraveyard: { type: "land" },
      text: "You may play lands from your graveyard.",
    },
  ],
});
