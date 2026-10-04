import { defineCard } from "../define.js";

// EDHREC rank 6345.
//
// Rulings:
//   [2017-03-14] Boros Reckoner's first ability will trigger even if it is dealt lethal damage.
//     For example, if it blocks a 7/7 creature, its ability will trigger and Boros Reckoner will
//     deal 7 damage to the target.
//   [2017-03-14] If Boros Reckoner is dealt damage by multiple sources at once, such as by two
//     creatures blocking it, its ability triggers once and one target is dealt that much damage.
//   [2017-03-14] Damage dealt by Boros Reckoner due to its first ability isn't combat damage, even
//     if it was combat damage that caused that ability to trigger.

export default defineCard({
  name: "Boros Reckoner",
  manaCost: "{R/W}{R/W}{R/W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Minotaur", "Wizard"],
  power: 3,
  toughness: 3,
  text: "Whenever this creature is dealt damage, it deals that much damage to any target.\n{R/W}: This creature gains first strike until end of turn.",
  activated: [
    {
      cost: { mana: "{R/W}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "first-strike",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{R/W}: This creature gains first strike until end of turn.",
    },
  ],
  triggered: [
    {
      // Brash Taunter's shape, aimed at any target.
      trigger: { on: "dealt-damage", who: "self" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: { triggerValue: true }, target: 0 },
      resolve: null,
      text: "Whenever this creature is dealt damage, it deals that much damage to any target.",
    },
  ],
});
