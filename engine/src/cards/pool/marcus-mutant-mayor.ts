import { defineCard } from "../define.js";

// EDHREC rank 6592.
//
// Whether "that creature has a +1/+1 counter on it" is read as the ability resolves; a creature
// that has left the battlefield since is read as it last existed there (rule 608.2h), and gets no
// counter if it had none.
const TEXT =
  "Whenever a creature you control deals combat damage to a player, draw a card if that creature has a +1/+1 counter on it. If it doesn't, put a +1/+1 counter on it.";

export default defineCard({
  name: "Marcus, Mutant Mayor",
  manaCost: "{3}{G}{U}",
  colors: ["G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Mutant", "Advisor"],
  power: 4,
  toughness: 4,
  keywords: ["vigilance", "trample"],
  text: `Vigilance, trample\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "trigger-object", filter: { counters: { kind: "+1/+1", compare: { op: "gte", n: 1 } } } },
        then: { kind: "draw", amount: 1 },
        else: { kind: "add-counter", target: "trigger-object", counter: "+1/+1", amount: 1 },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
