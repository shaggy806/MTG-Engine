import { defineCard } from "../define.js";

// #87 in top-commanders.txt.
//
// The second target's mana-value bound is read off the turn's life lost (a
// `{ amount }` operand), when the target is chosen and again on resolution.
const TRIGGER_TEXT =
  "At the beginning of your end step, put a number of +1/+1 counters on up to one other target " +
  "creature you control equal to the amount of life you gained this turn. Return up to one target " +
  "creature card with mana value less than or equal to the amount of life you lost this turn from " +
  "your graveyard to the battlefield.";

export default defineCard({
  name: "Betor, Ancestor's Voice",
  manaCost: "{2}{W}{B}{G}",
  colors: ["W", "B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spirit", "Dragon"],
  power: 3,
  toughness: 5,
  keywords: ["flying", "lifelink"],
  text: `Flying, lifelink\n${TRIGGER_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [
        { kind: "optional", of: { kind: "other", of: "creature-you-control" } },
        {
          kind: "optional",
          of: {
            kind: "card-in-graveyard",
            whose: "you",
            filter: {
              type: "creature",
              manaValue: { op: "lte", n: { amount: { turnStat: "life-lost", who: "you" } } },
            },
          },
        },
      ],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: { turnStat: "life-gained", who: "you" } },
          { kind: "put-onto-battlefield", target: 1 },
        ],
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
