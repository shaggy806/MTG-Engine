import { defineCard } from "../define.js";

// EDHREC rank 5290.
//
// Rulings:
//   [2019-01-25] You can always activate an ability that will cause a creature to adapt. As that
//     ability resolves, if the creature has a +1/+1 counter on it for any reason, you simply won't
//     put any +1/+1 counters on it.
//   [2019-01-25] An ability that triggers when counters are put on a permanent will trigger if
//     that permanent somehow enters the battlefield with those counters.
//   [2019-01-25] You draw a card and discard a card all while Benthic Biomancer's triggered
//     ability is resolving. Nothing can happen between the two, and no player may choose to take
//     actions.
//   [2019-01-25] If a creature somehow loses all of its +1/+1 counters, it can adapt again and get
//     more +1/+1 counters.

const ADAPT_TEXT = "{1}{U}: Adapt 1. (If this creature has no +1/+1 counters on it, put a +1/+1 counter on it.)";
const LOOT_TEXT = "Whenever one or more +1/+1 counters are put on this creature, draw a card, then discard a card.";

// Basking Broodscale's adapt and counters-put trigger.
export default defineCard({
  name: "Benthic Biomancer",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard", "Mutant"],
  power: 1,
  toughness: 1,
  text: `${ADAPT_TEXT}\n${LOOT_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}{U}", tap: false },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "source", filter: { counters: { kind: "+1/+1", compare: { op: "eq", n: 0 } } } },
        then: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      },
      resolve: null,
      text: ADAPT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "counters-put", who: "self", counter: "+1/+1" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "discard", target: "you", amount: 1 },
        ],
      },
      resolve: null,
      text: LOOT_TEXT,
    },
  ],
});
