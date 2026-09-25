import type { StaticCondition } from "../define.js";
import { defineCard } from "../define.js";

// #261 in top-commanders.txt.
//
// The first "if" is the intervening-if; the later two are checked as the
// ability resolves, each after the step before it (so the untap can't
// change the totals, but Betor counts herself throughout).
const TRIGGER_TEXT =
  "At the beginning of your end step, if creatures you control have total toughness 10 or greater, " +
  "draw a card. Then if creatures you control have total toughness 20 or greater, untap each " +
  "creature you control. Then if creatures you control have total toughness 40 or greater, each " +
  "opponent loses half their life, rounded up.";
const yours = { type: "creature", controlledBy: "you" } as const;
const totalToughness = (n: number): StaticCondition => ({
  kind: "aggregate",
  value: { aggregate: "sum", of: "toughness", filter: yours },
  compare: { op: "gte", n },
});

export default defineCard({
  name: "Betor, Kin to All",
  manaCost: "{2}{W}{B}{G}",
  colors: ["W", "B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spirit", "Dragon"],
  power: 5,
  toughness: 7,
  keywords: ["flying"],
  text: `Flying\n${TRIGGER_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: totalToughness(10),
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "conditional", condition: totalToughness(20), then: { kind: "untap-all", filter: yours } },
          {
            kind: "conditional",
            condition: totalToughness(40),
            then: {
              kind: "lose-life",
              who: "each-opponent",
              amount: { half: { lifeTotal: "each" }, round: "up" },
            },
          },
        ],
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
