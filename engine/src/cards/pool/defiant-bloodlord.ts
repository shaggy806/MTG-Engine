import { defineCard } from "../define.js";

// EDHREC rank 5939.
//
// Rulings:
//   [2015-08-25] The ability triggers just once for each life-gaining event, whether it’s 1 life
//     from Drana’s Emissary or 7 life from Nissa’s Renewal.
//   [2015-08-25] A creature with lifelink dealing combat damage is a single life-gaining event.
//     For example, if two creatures you control with lifelink deal combat damage at the same time,
//     the ability will trigger twice. However, if a single creature with lifelink deals combat
//     damage to multiple creatures, players, and/or planeswalkers at the same time (perhaps
//     because it has trample or was blocked by more than one creature), the ability will trigger
//     only once.
//   [2015-08-25] In a Two-Headed Giant game, life gained by your teammate won’t cause the ability
//     to trigger, even though it causes your team’s life total to increase.

export default defineCard({
  name: "Defiant Bloodlord",
  manaCost: "{5}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 4,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying\nWhenever you gain life, target opponent loses that much life.",
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      // Enduring Tenacity's shape.
      targets: ["opponent"],
      effect: { kind: "lose-life", amount: { triggerValue: true }, target: 0 },
      resolve: null,
      text: "Whenever you gain life, target opponent loses that much life.",
    },
  ],
});
