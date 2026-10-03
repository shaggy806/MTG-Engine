import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

const UPKEEP_TEXT =
  "At the beginning of your upkeep, put a number of +1/+1 counters on each other creature you control " +
  "equal to that creature's toughness.";

// Each creature's own toughness, all read before any counter goes on
// (`add-counter-all`'s `"own-toughness"`): a 2/3 gets three counters and
// becomes a 5/6.
export default defineCard({
  name: "Canopy Gargantuan",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 7,
  toughness: 7,
  keywords: ["flying"],
  text: `Flying, ward {2}\n${UPKEEP_TEXT}`,
  triggered: [
    ward({ mana: "{2}" }),
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: "own-toughness",
        exceptSource: true,
      },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
