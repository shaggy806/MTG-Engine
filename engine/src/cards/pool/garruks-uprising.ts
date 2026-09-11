import { defineCard } from "../define.js";

// needed-cards P7. The ETB draw is an *intervening-if* trigger (rule 603.4):
// "if you control a creature with power 4 or greater" is checked as the
// enchantment enters and again as the ability resolves, so killing the big
// creature in response stops the draw. The second clause is an ordinary
// filtered ETB trigger, and the trample grant an ordinary anthem.
const bigCreature = { type: "creature", power: { op: "gte", n: 4 } } as const;

export default defineCard({
  name: "Garruk's Uprising",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text:
    "When Garruk's Uprising enters, if you control a creature with power 4 or greater, draw a card.\n" +
    "Whenever a creature you control with power 4 or greater enters, draw a card.\n" +
    "Creatures you control have trample.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      condition: { kind: "controls", filter: bigCreature, atLeast: 1 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text:
        "When Garruk's Uprising enters, if you control a creature with power 4 or greater, draw a card.",
    },
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: bigCreature,
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever a creature you control with power 4 or greater enters, draw a card.",
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["trample"],
      text: "Creatures you control have trample.",
    },
  ],
});
