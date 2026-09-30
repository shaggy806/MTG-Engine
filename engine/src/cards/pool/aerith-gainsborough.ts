import { defineCard } from "../define.js";

const GAIN_TEXT = "Whenever you gain life, put a +1/+1 counter on Aerith Gainsborough.";
const DIES_TEXT =
  "When Aerith Gainsborough dies, put X +1/+1 counters on each legendary creature you control, where X is the number of +1/+1 counters on Aerith Gainsborough.";

// X is the counters she died with (last-known information).
export default defineCard({
  name: "Aerith Gainsborough",
  manaCost: "{2}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 2,
  toughness: 2,
  keywords: ["lifelink"],
  text: `Lifelink\n${GAIN_TEXT}\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: GAIN_TEXT,
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", supertype: "legendary", controlledBy: "you" },
        counter: "+1/+1",
        amount: { countersOn: "source", counter: "+1/+1" },
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
