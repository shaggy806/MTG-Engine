import { defineCard } from "../define.js";

// EDHREC rank 3488.
//
// Rulings:
//   [2024-06-07] Returning the Elf you control to its owner's hand is the cost to activate the
//     ability. Once you activate the ability, no one can try to do anything to the Elf to stop you
//     from activating the ability.
//   [2024-06-07] You can target any creature with Wirewood Symbiote's ability, not just a tapped
//     creature.

export default defineCard({
  name: "Wirewood Symbiote",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 1,
  toughness: 1,
  text: "Return an Elf you control to its owner's hand: Untap target creature. Activate only once each turn.",
  // Quirion Ranger's shape: the Elf is returned as the cost (the ruling).
  activated: [
    {
      cost: { mana: null, tap: false, returnToHand: { count: 1, filter: { subtype: "Elf" } } },
      targets: ["creature"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "Return an Elf you control to its owner's hand: Untap target creature. Activate only once each turn.",
      oncePerTurn: true,
    },
  ],
});
