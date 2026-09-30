import { defineCard } from "../define.js";

const ENTER_TEXT =
  "This creature enters with a number of +1/+1 counters on it equal to the number of creatures that died this turn.";
const DIES_TEXT =
  "When this creature dies, you draw X cards and you lose X life, where X is the number of +1/+1 counters on it.";
const X = { countersOn: "source", counter: "+1/+1" } as const;

// Every creature that died this turn, whoever controlled it; X is the
// counters it had as it died.
export default defineCard({
  name: "Bone Devourer",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 2,
  toughness: 2,
  keywords: ["flash", "flying"],
  text: `Flash\nFlying\n${ENTER_TEXT}\n${DIES_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        counters: { kind: "+1/+1", amount: { creaturesDiedThisTurn: true, anyController: true } },
      },
      text: ENTER_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: X },
          { kind: "lose-life", amount: X, who: "you" },
        ],
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
