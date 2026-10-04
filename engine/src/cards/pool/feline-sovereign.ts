import { defineCard } from "../define.js";

// EDHREC rank 3420.
//
// Rulings:
//   [2020-06-23] Because damage remains marked on a creature until the damage is removed as the
//     turn ends, nonlethal damage dealt to a Cat you control may become lethal if Feline Sovereign
//     leaves the battlefield during that turn.

const STATIC_TEXT = "Other Cats you control get +1/+1 and have protection from Dogs.";
const DESTROY_TEXT =
  "Whenever one or more Cats you control deal combat damage to a player, destroy up to one target artifact or enchantment that player controls.";

export default defineCard({
  name: "Feline Sovereign",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Cat"],
  power: 2,
  toughness: 3,
  text: `${STATIC_TEXT}\n${DESTROY_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Cat" },
      grantPt: [1, 1],
      // Protection from a subtype — Yawgmoth, Thran Physician's filter.
      protection: { filter: { subtype: "Dog" } },
      text: STATIC_TEXT,
    },
  ],
  triggered: [
    {
      // Once per player dealt damage (Alela, Cunning Conqueror's shape);
      // "that player" is the trigger player.
      trigger: { on: "deals-damage-batch", who: "you-control", filter: { subtype: "Cat" }, combat: true },
      targets: [
        {
          kind: "optional",
          of: {
            kind: "permanent",
            whose: "trigger-player",
            filter: { typesAnyOf: ["artifact", "enchantment"] },
          },
        },
      ],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: DESTROY_TEXT,
    },
  ],
});
