import { defineCard } from "../define.js";

// EDHREC rank 5920.
//
// Rulings:
//   [2023-09-01] Will's activated ability can't reduce the amount of colored mana you pay for a
//     spell. It reduces only the generic mana component of that cost.
//   [2023-09-01] Will's activated ability counts the total amount of life you gained without
//     taking into account any life you lost during that turn. For example, if you gained 3 life
//     and lost 3 life earlier in the turn, the cost of white and/or blue spells you cast this turn
//     will be reduced by {3}.
//   [2023-09-01] The value of X is determined only once, at the time Will, Scion of Peace's
//     activated ability resolves.
//   [2023-09-01] Will's activated ability doesn't change the mana cost or mana value of any spell.
//     It changes only the total cost you pay.

export default defineCard({
  name: "Will, Scion of Peace",
  manaCost: "{1}{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 4,
  keywords: ["vigilance"],
  text: "Vigilance\n{T}: Spells you cast this turn that are white and/or blue cost {X} less to cast, where X is the amount of life you gained this turn. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      // Rowan, Scion of War's shape: X read as it resolves and fixed (the ruling).
      effect: {
        kind: "player-effect",
        duration: "end-of-turn",
        reduceSpells: {
          applies: { anyOf: [{ colors: ["W"] }, { colors: ["U"] }] },
          reduceGeneric: { turnStat: "life-gained", who: "you" },
        },
      },
      resolve: null,
      text: "{T}: Spells you cast this turn that are white and/or blue cost {X} less to cast, where X is the amount of life you gained this turn. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
