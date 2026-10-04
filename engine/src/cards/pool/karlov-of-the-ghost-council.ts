import { defineCard } from "../define.js";

// EDHREC rank 3880.
//
// Rulings:
//   [2015-11-04] A creature with lifelink dealing combat damage is a single life-gaining event.
//     For example, if two creatures you control with lifelink deal combat damage at the same time,
//     the ability will trigger twice. However, if a single creature with lifelink deals combat
//     damage to multiple players or permanents at the same time (perhaps because it has trample or
//     was blocked by more than one creature), the ability will trigger only once.
//   [2015-11-04] The ability triggers just once for each life-gaining event, whether it's 1 life
//     from an attacking creature with lifelink or 4 life from Faith's Fetters.
//   [2015-11-04] In a Two-Headed Giant game, life gained by your teammate won't cause the ability
//     to trigger, even though it causes your team's life total to increase.

export default defineCard({
  name: "Karlov of the Ghost Council",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spirit", "Advisor"],
  power: 2,
  toughness: 2,
  text: "Whenever you gain life, put two +1/+1 counters on Karlov.\n{W}{B}, Remove six +1/+1 counters from Karlov: Exile target creature.",
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 },
      resolve: null,
      text: "Whenever you gain life, put two +1/+1 counters on Karlov.",
    },
  ],
  activated: [
    {
      cost: { mana: "{W}{B}", tap: false, removeCounter: { kind: "+1/+1", count: 6 } },
      targets: ["creature"],
      effect: { kind: "exile", target: 0 },
      resolve: null,
      text: "{W}{B}, Remove six +1/+1 counters from Karlov: Exile target creature.",
    },
  ],
});
