import { defineCard } from "../define.js";

// Top-commanders rank 131. "Whenever you draw a card" is a `draws` trigger,
// once per card drawn; its target is the ability's own, chosen as the
// trigger goes on the stack.
export default defineCard({
  name: "Niv-Mizzet, Parun",
  manaCost: "{U}{U}{U}{R}{R}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon", "Wizard"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  cantBeCountered: true,
  text:
    "This spell can't be countered.\n" +
    "Flying\n" +
    "Whenever you draw a card, Niv-Mizzet deals 1 damage to any target.\n" +
    "Whenever a player casts an instant or sorcery spell, you draw a card.",
  triggered: [
    {
      trigger: { on: "draws", who: "you" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "Whenever you draw a card, Niv-Mizzet deals 1 damage to any target.",
    },
    {
      trigger: {
        on: "cast-spell",
        who: "any",
        filter: { typesAnyOf: ["instant", "sorcery"] },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever a player casts an instant or sorcery spell, you draw a card.",
    },
  ],
});
