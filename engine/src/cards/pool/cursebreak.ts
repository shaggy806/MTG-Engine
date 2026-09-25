import { defineCard } from "../define.js";

export default defineCard({
  name: "Cursebreak",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Destroy target enchantment. You gain 2 life.",
  targets: ["enchantment"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "destroy", target: 0 }, { kind: "gain-life", amount: 2 }],
  },
});
