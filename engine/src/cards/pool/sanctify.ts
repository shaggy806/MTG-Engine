import { defineCard } from "../define.js";

export default defineCard({
  name: "Sanctify",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Destroy target artifact or enchantment. You gain 3 life.",
  targets: ["artifact-or-enchantment"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "destroy", target: 0 }, { kind: "gain-life", amount: 3 }],
  },
});
