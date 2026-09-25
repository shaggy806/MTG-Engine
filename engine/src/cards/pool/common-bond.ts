import { defineCard } from "../define.js";

export default defineCard({
  name: "Common Bond",
  manaCost: "{1}{G}{W}",
  colors: ["W", "G"],
  types: ["instant"],
  text: "Put a +1/+1 counter on target creature.\nPut a +1/+1 counter on target creature.",
  targets: ["creature", "creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      { kind: "add-counter", target: 1, counter: "+1/+1", amount: 1 },
    ],
  },
});
