import { defineCard } from "../define.js";

// EDHREC rank 5435.
//
// Rulings:
//   [2019-01-25] If a creature somehow loses all of its +1/+1 counters, it can adapt again and get
//     more +1/+1 counters.
//   [2019-01-25] You can always activate an ability that will cause a creature to adapt. As that
//     ability resolves, if the creature has a +1/+1 counter on it for any reason, you simply won't
//     put any +1/+1 counters on it.

const ENTER_TEXT = "When Zegana enters, if you control another creature with a +1/+1 counter on it, draw a card.";
const ADAPT_TEXT = "{4}{G}{U}: Adapt 4. (If this creature has no +1/+1 counters on it, put four +1/+1 counters on it.)";
const TRAMPLE_TEXT = "Each creature you control with a +1/+1 counter on it has trample.";

// Adapt is Evolution Witness's shape: checked as the ability resolves.
export default defineCard({
  name: "Zegana, Utopian Speaker",
  manaCost: "{2}{G}{U}",
  colors: ["U", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard"],
  power: 4,
  toughness: 4,
  text: `${ENTER_TEXT}\n${ADAPT_TEXT}\n${TRAMPLE_TEXT}`,
  activated: [
    {
      cost: { mana: "{4}{G}{U}", tap: false },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "self-counters", counter: "+1/+1", compare: { op: "eq", n: 0 } },
        then: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 4 },
      },
      resolve: null,
      text: ADAPT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      condition: {
        kind: "controls",
        filter: { type: "creature", counters: { kind: "+1/+1", compare: { op: "gte", n: 1 } } },
        atLeast: 1,
        excludeSelf: true,
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", counters: { kind: "+1/+1", compare: { op: "gte", n: 1 } } },
      },
      grantKeywords: ["trample"],
      text: TRAMPLE_TEXT,
    },
  ],
});
