import { defineCard } from "../define.js";

const ENTER_TEXT = "Mikaeus enters with X +1/+1 counters on it.";
const GROW_TEXT = "{T}: Put a +1/+1 counter on Mikaeus.";
const SHARE_TEXT = "{T}, Remove a +1/+1 counter from Mikaeus: Put a +1/+1 counter on each other creature you control.";

export default defineCard({
  name: "Mikaeus, the Lunarch",
  manaCost: "{X}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 0,
  toughness: 0,
  text: `${ENTER_TEXT}\n${GROW_TEXT}\n${SHARE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: "x" } },
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: GROW_TEXT,
    },
    {
      cost: { mana: null, tap: true, removeCounter: { kind: "+1/+1", count: 1 } },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
        exceptSource: true,
      },
      resolve: null,
      text: SHARE_TEXT,
    },
  ],
});
