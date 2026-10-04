import { defineCard } from "../define.js";

// EDHREC rank 5175.
//
// Rulings:
//   [2023-11-10] If it's not your turn and you gain control of a creature with a boast ability
//     after that creature attacked, you can activate that creature's boast ability if it hasn't
//     been activated yet that turn.
//   [2023-11-10] If an effect adds additional combat phases to a turn and a creature with a boast
//     ability attacks more than once during that turn, its boast ability can still be activated
//     only once.
//   [2023-11-10] The back face of a double-faced card doesn't have a mana cost. A double-faced
//     permanent with its back face up has a mana value equal to the mana value of its front face.
//   [2023-11-10] If a creature with a boast ability is put onto the battlefield attacking, it was
//     never declared as an attacker. Its boast ability can't be activated that turn.
//   [2023-11-10] A boast ability can be activated at any point after the creature with that
//     ability has been declared as an attacker. This can be before blockers are declared, after
//     blockers are declared but before combat damage is dealt, during combat after combat damage
//     is dealt, during the postcombat main phase, during the end step, or, in some unusual cases,
//     during the cleanup step.

export default defineCard({
  name: "Broadside Bombardiers",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Pirate"],
  power: 2,
  toughness: 2,
  keywords: ["menace", "haste"],
  text: "Menace, haste\nBoast — Sacrifice another creature or artifact: This creature deals damage equal to 2 plus the sacrificed permanent's mana value to any target. (Activate only if this creature attacked this turn and only once each turn.)",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        sacrifice: { filter: { typesAnyOf: ["creature", "artifact"], controlledBy: "you" } },
      },
      // `otherOnly` makes the sacrifice "another" (Ayara's shape); the mana
      // value is the sacrificed permanent's as it last existed (Birthing Pod).
      otherOnly: true,
      boast: true,
      targets: ["any-target"],
      effect: { kind: "damage", amount: { sum: [2, { manaValueOf: "sacrificed" }] }, target: 0 },
      resolve: null,
      text: "Boast — Sacrifice another creature or artifact: This creature deals damage equal to 2 plus the sacrificed permanent's mana value to any target.",
    },
  ],
});
