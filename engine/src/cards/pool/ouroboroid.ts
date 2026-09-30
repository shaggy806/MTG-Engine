import { defineCard } from "../define.js";

const TEXT =
  "At the beginning of combat on your turn, put X +1/+1 counters on each creature you control, where X is this creature's power.";

// X is read once, as the ability resolves — as the creature last existed if
// it has left (its rulings) — so it doesn't grow with its own counters.
export default defineCard({
  name: "Ouroboroid",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant", "Wurm"],
  power: 1,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: { powerOf: "source" },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
