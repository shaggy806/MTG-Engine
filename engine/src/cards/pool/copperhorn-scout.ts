import { defineCard } from "../define.js";

// EDHREC rank 5601.
//
// Rulings:
//   [2011-01-01] Untapping an attacking creature doesn’t cause it to stop attacking.
//   [2011-01-01] As Copperhorn Scout’s ability resolves, you’ll untap each other creature you
//     control regardless of whether that creature was attacking.

export default defineCard({
  name: "Copperhorn Scout",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Scout"],
  power: 1,
  toughness: 1,
  text: "Whenever this creature attacks, untap each other creature you control.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      // Combat Celebrant's "other": the Scout itself stays tapped.
      effect: { kind: "untap-all", filter: { type: "creature", controlledBy: "you" }, exceptSource: true },
      resolve: null,
      text: "Whenever this creature attacks, untap each other creature you control.",
    },
  ],
});
