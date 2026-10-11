import { defineCard } from "../define.js";

const DOGS_TEXT = "When this creature enters, target opponent creates two 1/1 white Dog creature tokens.";
const DIES_TEXT = "When this creature dies, each opponent loses 3 life.";

// Disguise {1}{B} (rule 702.168): cast face down it enters as a 2/2 with
// ward {2} and no abilities, so no Dogs; turned face up it doesn't enter
// (708.8), so none then either.
export default defineCard({
  name: "Hunted Bonebrute",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Skeleton", "Beast"],
  power: 6,
  toughness: 2,
  keywords: ["menace"],
  text: `Menace\n${DOGS_TEXT}\n${DIES_TEXT}\nDisguise {1}{B}`,
  morph: { keyword: "disguise", cost: "{1}{B}" },
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["opponent"],
      effect: { kind: "create-token", token: "1/1 White Dog Token", count: 2, who: "target-controller" },
      resolve: null,
      text: DOGS_TEXT,
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "lose-life", amount: 3, who: "each-opponent" },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
