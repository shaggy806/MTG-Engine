import { defineCard } from "../define.js";

// EDHREC rank 5732.
//
// Rulings:
//   [2004-10-04] This does not trigger on a permanent being turned into a creature. That is just a
//     permanent changing type, not something entering.
//   [2004-10-04] Angelic Chorus does not trigger when creatures phase in or change controllers.
//
// Verdant Sun's Avatar's shape: the toughness is read as the ability resolves,
// or as the creature last existed if it has left.

export default defineCard({
  name: "Angelic Chorus",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: "Whenever a creature you control enters, you gain life equal to its toughness.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "gain-life", amount: { toughnessOf: "trigger-object" } },
      resolve: null,
      text: "Whenever a creature you control enters, you gain life equal to its toughness.",
    },
  ],
});
