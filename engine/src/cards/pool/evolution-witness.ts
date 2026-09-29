import { defineCard } from "../define.js";

const ADAPT_TEXT = "{1}{G}: Adapt 2. (If this creature has no +1/+1 counters on it, put two +1/+1 counters on it.)";
const RETURN_TEXT =
  "Whenever one or more +1/+1 counters are put on this creature, return target permanent card from your graveyard to your hand.";

// Adapt (rule 701.46) asks as it resolves: with any +1/+1 counter by then it
// puts none, and one that has lost them all can adapt again (the rulings).
export default defineCard({
  name: "Evolution Witness",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman", "Mutant"],
  power: 2,
  toughness: 1,
  text: `${ADAPT_TEXT}\n${RETURN_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "self-counters", counter: "+1/+1", compare: { op: "eq", n: 0 } },
        then: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 },
      },
      resolve: null,
      text: ADAPT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "counters-put", who: "self", counter: "+1/+1" },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker", "battle"] },
        },
      ],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
