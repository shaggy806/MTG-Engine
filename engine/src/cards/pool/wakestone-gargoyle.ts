import { defineCard } from "../define.js";

// The ability is a rule for the rest of the turn, so it covers a creature
// with defender that comes under your control after it resolves, and the
// Gargoyle itself (2006-05-01 rulings).
export default defineCard({
  name: "Wakestone Gargoyle",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Gargoyle"],
  power: 3,
  toughness: 4,
  keywords: ["defender", "flying"],
  text:
    "Defender, flying\n" +
    "{1}{W}: Creatures you control with defender can attack this turn as though they didn't have defender.",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: [],
      effect: {
        kind: "attack-despite-defender",
        filter: { type: "creature", controlledBy: "you", keyword: "defender" },
      },
      resolve: null,
      text:
        "{1}{W}: Creatures you control with defender can attack this turn as though they didn't have defender.",
    },
  ],
});
