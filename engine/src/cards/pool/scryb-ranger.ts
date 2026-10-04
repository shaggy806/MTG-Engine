import { defineCard } from "../define.js";

// EDHREC rank 5386.
// Quirion Ranger's ability: any land with the subtype Forest pays the cost,
// returned as the ability is activated.

const TEXT = "Return a Forest you control to its owner's hand: Untap target creature. Activate only once each turn.";

export default defineCard({
  name: "Scryb Ranger",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Faerie", "Ranger"],
  power: 1,
  toughness: 1,
  keywords: ["flash", "flying"],
  text: `Flash\nFlying, protection from blue\n${TEXT}`,
  static: [{ affects: { scope: "self" }, protection: { colors: ["U"] }, text: "Protection from blue" }],
  activated: [
    {
      cost: { mana: null, tap: false, returnToHand: { count: 1, filter: { subtype: "Forest" } } },
      targets: ["creature"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: TEXT,
      oncePerTurn: true,
    },
  ],
});
