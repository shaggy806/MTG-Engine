import { defineCard } from "../define.js";

// EDHREC rank 2559.
//
// Rulings:
//   [2025-11-17] Changeling is a characteristic-defining ability. It functions in all zones, not
//     only while a card that has it is on the battlefield.

export default defineCard({
  name: "Chomping Changeling",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Shapeshifter"],
  power: 1,
  toughness: 2,
  keywords: ["changeling"],
  text: "Changeling (This card is every creature type.)\nWhen this creature enters, destroy up to one target artifact or enchantment.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "optional", of: "artifact-or-enchantment" }],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "When this creature enters, destroy up to one target artifact or enchantment.",
    },
  ],
});
