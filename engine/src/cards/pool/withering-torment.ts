import { defineCard } from "../define.js";

export default defineCard({
  name: "Withering Torment",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Destroy target creature or enchantment. You lose 2 life.",
  targets: ["creature-or-enchantment"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      // Not optional and not a cost — the life is lost on resolution even if
      // the target is gone by then, so it sits inside the same sequence.
      { kind: "lose-life", amount: 2, who: "you" },
    ],
  },
});
