import { defineCard } from "../define.js";
import { powerUp } from "../helpers.js";

// EDHREC rank 16333.
//
// "Draw a card if her power is 4 or greater" is checked as the trigger
// resolves, not as it triggers: the "if" isn't at the front (rule 603.4).
const SENSES_TEXT = "Cybernetic Senses — Whenever Viv Vision attacks, draw a card if her power is 4 or greater.";
const POWER_UP_TEXT =
  "Power-up — {7}: Put two +1/+1 counters on Viv Vision. (Activate each power-up ability only once. Reduce the " +
  "cost by her mana cost if she entered this turn.)";

export default defineCard({
  name: "Viv Vision, Teen Synthezoid",
  manaCost: "{3}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Robot", "Hero"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${SENSES_TEXT}\n${POWER_UP_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "source", filter: { power: { op: "gte", n: 4 } } },
        then: { kind: "draw", amount: 1 },
      },
      resolve: null,
      text: SENSES_TEXT,
    },
  ],
  activated: [powerUp("{7}", { kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 }, POWER_UP_TEXT)],
});
