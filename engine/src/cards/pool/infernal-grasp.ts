import { defineCard } from "../define.js";

export default defineCard({
  name: "Infernal Grasp",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Destroy target creature. You lose 2 life.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      { kind: "lose-life", amount: 2, who: "you" },
    ],
  },
});
