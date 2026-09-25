import { defineCard } from "../define.js";

export default defineCard({
  name: "Monstrous Carabid",
  manaCost: "{3}{B}{R}",
  colors: ["B", "R"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 4,
  toughness: 4,
  cycling: { cost: "{B/R}" },
  text: "This creature attacks each combat if able.\nCycling {B/R} ({B/R}, Discard this card: Draw a card.)",
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["must-attack"],
      text: "This creature attacks each combat if able.",
    },
  ],
});
