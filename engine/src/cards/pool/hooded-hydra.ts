import { defineCard } from "../define.js";

const ENTERS_TEXT = "This creature enters with X +1/+1 counters on it.";
const DIES_TEXT = "When this creature dies, create a 1/1 green Snake creature token for each +1/+1 counter on it.";
const FACE_UP_TEXT = "As this creature is turned face up, put five +1/+1 counters on it.";

// Cast face down it enters as a 2/2 with no counters (X is 0, and a face-down
// spell has no abilities — 708.2a); turned face up for {3}{G}{G}, or any
// other way, it gets five as it is (`asTurnedFaceUp`, before anything sees
// it face up). The Snakes count the counters it had as it last existed.
export default defineCard({
  name: "Hooded Hydra",
  manaCost: "{X}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Snake", "Hydra"],
  power: 0,
  toughness: 0,
  text: `${ENTERS_TEXT}\n${DIES_TEXT}\nMorph {3}{G}{G}\n${FACE_UP_TEXT}`,
  morph: { keyword: "morph", cost: "{3}{G}{G}" },
  asTurnedFaceUp: { counters: 5 },
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: "x" } },
      text: ENTERS_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Snake Token", count: { countersOn: "source", counter: "+1/+1" } },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
