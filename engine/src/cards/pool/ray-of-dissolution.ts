import { defineCard } from "../define.js";

export default defineCard({
  name: "Ray of Dissolution",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Destroy target enchantment. You gain 3 life.",
  targets: ["enchantment"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "destroy", target: 0 }, { kind: "gain-life", amount: 3 }],
  },
});
