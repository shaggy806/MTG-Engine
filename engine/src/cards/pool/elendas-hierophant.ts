import { defineCard } from "../define.js";

const GAIN_TEXT = "Whenever you gain life, put a +1/+1 counter on this creature.";
const DIES_TEXT = "When this creature dies, create X 1/1 white Vampire creature tokens with lifelink, where X is its power.";

// X is its power as it last existed on the battlefield.
export default defineCard({
  name: "Elenda's Hierophant",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Vampire", "Cleric"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: `Flying\n${GAIN_TEXT}\n${DIES_TEXT}`,
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
      effect: { kind: "create-token", token: "Lifelink Vampire Token", count: { powerOf: "source" } },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
