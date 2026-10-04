import { defineCard } from "../define.js";

// EDHREC rank 5679.
//
// Rulings:
//   [2009-10-01] If Warren Instigator attacks an opponent and isn’t blocked, its double strike
//     ability will cause it to deal combat damage to that opponent twice, once during each combat
//     damage step. Its triggered ability will thus trigger twice: Warren Instigator deals
//     first-strike combat damage, its ability triggers and resolves, it deals regular combat
//     damage, and its ability triggers and resolves again.
//   [2009-10-01] Warren Instigator’s ability triggers when it deals any kind of damage to an
//     opponent, not just combat damage.

export default defineCard({
  name: "Warren Instigator",
  manaCost: "{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Berserker"],
  power: 1,
  toughness: 1,
  keywords: ["double-strike"],
  text: "Double strike\nWhenever this creature deals damage to an opponent, you may put a Goblin creature card from your hand onto the battlefield.",
  triggered: [
    {
      // Any damage, not only combat damage (the ruling); double strike
      // triggers it once per combat damage step.
      trigger: { on: "deals-damage", who: "self", to: "opponent" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "creature", subtype: "Goblin" },
      },
      resolve: null,
      text: "Whenever this creature deals damage to an opponent, you may put a Goblin creature card from your hand onto the battlefield.",
    },
  ],
});
