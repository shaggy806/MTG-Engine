import { defineCard } from "../define.js";

// #285 in top-commanders.txt.
//
// "Power less than Mirko's" is read off Mirko as the target is chosen and
// again on resolution.
const SURVEIL_TEXT = "Whenever you surveil, put a +1/+1 counter on Mirko.";
const RETURN_TEXT =
  "At the beginning of your end step, you may return target creature card with power less than " +
  "Mirko's from your graveyard to the battlefield with a finality counter on it. (If it would die, " +
  "exile it instead.)";

export default defineCard({
  name: "Mirko, Obsessive Theorist",
  manaCost: "{1}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Detective"],
  power: 1,
  toughness: 3,
  keywords: ["flying", "vigilance"],
  text: `Flying, vigilance\n${SURVEIL_TEXT}\n${RETURN_TEXT}`,
  triggered: [
    {
      trigger: { on: "surveils", who: "you" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: SURVEIL_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { type: "creature", power: { op: "lt", n: { amount: { powerOf: "source" } } } },
        },
      ],
      effect: {
        kind: "may",
        prompt: "Return the target creature card with a finality counter on it?",
        effect: { kind: "put-onto-battlefield", target: 0, withCounters: { kind: "finality", amount: 1 } },
      },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
