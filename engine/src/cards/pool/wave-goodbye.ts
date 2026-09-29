import { defineCard } from "../define.js";

export default defineCard({
  name: "Wave Goodbye",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Return each creature without a +1/+1 counter on it to its owner's hand.",
  effect: {
    kind: "return-to-hand-all",
    filter: { type: "creature", counters: { kind: "+1/+1", compare: { op: "eq", n: 0 } } },
  },
});
