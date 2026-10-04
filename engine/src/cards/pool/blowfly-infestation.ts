import { defineCard } from "../define.js";

// EDHREC rank 3077.
//
// "If it had a -1/-1 counter on it" reads the creature as it last existed on
// the battlefield (Necroskitter's filter). One counter goes on however many it
// had, and the target is mandatory — your own creature if it's the only one
// (the rulings).
const TEXT = "Whenever a creature dies, if it had a -1/-1 counter on it, put a -1/-1 counter on target creature.";

export default defineCard({
  name: "Blowfly Infestation",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: {
        on: "dies",
        who: "any",
        filter: { type: "creature", counters: { kind: "-1/-1", compare: { op: "gte", n: 1 } } },
      },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "-1/-1", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
