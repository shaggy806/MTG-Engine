import { defineCard } from "../define.js";

// EDHREC rank 5734.
//
// Rulings:
//   [2004-12-01] If the creature is dealt damage by more than one source at the same time, it gets
//     only one counter.
//   [2004-12-01] The creature doesn't get a counter if all the damage that would be dealt to it is
//     prevented.
//
// Sonic the Hedgehog's `dealt-damage` shape: one trigger per damaged creature
// per damage event, however many sources dealt it (the first ruling), and
// none for damage prevented (never dealt). The counter goes on the trigger
// object, so a creature that died of the damage gets nothing.

const TEXT =
  "Whenever a creature you control is dealt damage, put a +1/+1 counter on it. (It must survive the damage to get the counter.)";

export default defineCard({
  name: "Rite of Passage",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dealt-damage", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "add-counter", target: "trigger-object", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
