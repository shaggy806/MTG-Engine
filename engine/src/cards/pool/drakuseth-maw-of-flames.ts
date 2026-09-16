import { defineCard } from "../define.js";

// "each of up to two other targets" — two optional slots, so Drakuseth can
// attack into a board that only offers the one target it must have.
export default defineCard({
  name: "Drakuseth, Maw of Flames",
  manaCost: "{4}{R}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 7,
  toughness: 7,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Whenever Drakuseth, Maw of Flames attacks, it deals 4 damage to any target " +
    "and 3 damage to each of up to two other targets.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [
        "any-target",
        { kind: "optional", of: "any-target" },
        { kind: "optional", of: "any-target" },
      ],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "damage", amount: 4, target: 0 },
          { kind: "damage", amount: 3, target: 1 },
          { kind: "damage", amount: 3, target: 2 },
        ],
      },
      resolve: null,
      text:
        "Whenever Drakuseth, Maw of Flames attacks, it deals 4 damage to any target " +
        "and 3 damage to each of up to two other targets.",
    },
  ],
});
