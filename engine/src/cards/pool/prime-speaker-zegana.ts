import { defineCard } from "../define.js";

const ENTER_TEXT =
  "Prime Speaker Zegana enters with X +1/+1 counters on it, where X is the greatest power among other creatures you control.";
const DRAW_TEXT = "When Prime Speaker Zegana enters, draw cards equal to its power.";

// X is read once, as it enters, never counting itself or a creature entering
// with it (the rulings); the draw reads its power as the trigger resolves, as
// it last existed on the battlefield if it has left (its ruling).
export default defineCard({
  name: "Prime Speaker Zegana",
  manaCost: "{2}{G}{G}{U}{U}",
  colors: ["G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard"],
  power: 1,
  toughness: 1,
  text: `${ENTER_TEXT}\n${DRAW_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        counters: {
          kind: "+1/+1",
          amount: { aggregate: "max", of: "power", filter: { type: "creature", controlledBy: "you" } },
        },
      },
      text: ENTER_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: { powerOf: "source" } },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
