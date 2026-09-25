import { defineCard } from "../define.js";

export default defineCard({
  name: "Appetite for the Unnatural",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Destroy target artifact or enchantment. You gain 2 life.",
  targets: ["artifact-or-enchantment"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "destroy", target: 0 }, { kind: "gain-life", amount: 2 }],
  },
});
