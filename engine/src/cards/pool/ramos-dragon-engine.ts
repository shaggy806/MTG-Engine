import { defineCard } from "../define.js";

// #180 in top-commanders.txt.
//
// The mana ability's cost is counters, which the auto-payer doesn't remove
// by itself, so it's activated by hand and its mana floats. Five `add-mana`
// steps in one `sequence` are still one mana ability.
const COUNTER_TEXT = "Whenever you cast a spell, put a +1/+1 counter on Ramos for each of that spell's colors.";
const MANA_TEXT =
  "Remove five +1/+1 counters from Ramos: Add {W}{W}{U}{U}{B}{B}{R}{R}{G}{G}. Activate only once each turn.";

export default defineCard({
  name: "Ramos, Dragon Engine",
  manaCost: "{6}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${COUNTER_TEXT}\n${MANA_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: { colorsOf: "trigger-object" } },
      resolve: null,
      text: COUNTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, removeCounter: { kind: "+1/+1", count: 5 } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: (["W", "U", "B", "R", "G"] as const).map((mana) => ({
          kind: "add-mana" as const,
          mana,
          amount: 2,
        })),
      },
      resolve: null,
      oncePerTurn: true,
      text: MANA_TEXT,
    },
  ],
});
