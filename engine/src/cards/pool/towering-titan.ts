import { defineCard } from "../define.js";

const ENTER_TEXT =
  "This creature enters with X +1/+1 counters on it, where X is the total toughness of other creatures you control.";
const SAC_TEXT = "Sacrifice a creature with defender: All creatures gain trample until end of turn.";

// X is counted as it enters, without itself or anything entering with it.
export default defineCard({
  name: "Towering Titan",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Giant"],
  power: 0,
  toughness: 0,
  text: `${ENTER_TEXT}\n${SAC_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        counters: {
          kind: "+1/+1",
          amount: { aggregate: "sum", of: "toughness", filter: { type: "creature", controlledBy: "you" }, excludeSelf: true },
        },
      },
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "creature", keyword: "defender", controlledBy: "you" } } },
      targets: [],
      effect: { kind: "grant-keyword-all", filter: { type: "creature" }, keyword: "trample", duration: "end-of-turn" },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});
