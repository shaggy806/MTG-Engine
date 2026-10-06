import { defineCard } from "../define.js";

// EDHREC rank 6524.
//
// Rulings:
//   [2024-09-20] While resolving Vile Mutilator's last ability, the next opponent in turn order
//     chooses a nontoken enchantment they control, then each other opponent in turn order does
//     the same. Then each of the chosen nontoken enchantments are sacrificed simultaneously.
//     Finally, repeat this process for nontoken creatures.

const ENTER_TEXT =
  "When this creature enters, each opponent sacrifices a nontoken enchantment of their choice, then sacrifices a nontoken creature of their choice.";

export default defineCard({
  name: "Vile Mutilator",
  manaCost: "{5}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 6,
  toughness: 5,
  keywords: ["flying", "trample"],
  text: `As an additional cost to cast this spell, sacrifice a creature or enchantment.\nFlying, trample\n${ENTER_TEXT}`,
  additionalCost: { sacrifice: { typesAnyOf: ["creature", "enchantment"], controlledBy: "you" } },
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "sacrifice", who: "each-opponent", filter: { type: "enchantment", token: false }, count: 1 },
          { kind: "sacrifice", who: "each-opponent", filter: { type: "creature", token: false }, count: 1 },
        ],
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
