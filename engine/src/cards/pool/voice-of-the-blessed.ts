import { defineCard } from "../define.js";

// EDHREC rank 3054.
//
// Once per life-gain event, however much (the rulings — `gains-life`). The
// keyword thresholds are Primordial Hydra's `self-counters` shape.
const GAIN_TEXT = "Whenever you gain life, put a +1/+1 counter on this creature.";
const FOUR_TEXT = "As long as this creature has four or more +1/+1 counters on it, it has flying and vigilance.";
const TEN_TEXT = "As long as this creature has ten or more +1/+1 counters on it, it has indestructible.";

export default defineCard({
  name: "Voice of the Blessed",
  manaCost: "{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit", "Cleric"],
  power: 2,
  toughness: 2,
  text: `${GAIN_TEXT}\n${FOUR_TEXT}\n${TEN_TEXT}`,
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: GAIN_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "self-counters", counter: "+1/+1", compare: { op: "gte", n: 4 } },
      grantKeywords: ["flying", "vigilance"],
      text: FOUR_TEXT,
    },
    {
      affects: { scope: "self" },
      condition: { kind: "self-counters", counter: "+1/+1", compare: { op: "gte", n: 10 } },
      grantKeywords: ["indestructible"],
      text: TEN_TEXT,
    },
  ],
});
