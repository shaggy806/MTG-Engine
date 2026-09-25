import { defineCard } from "../define.js";

export default defineCard({
  name: "Fill with Fright",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Target player discards two cards. Scry 2. (Look at the top two cards of your library, then put any number of them on the bottom and the rest on top in any order.)",
  targets: ["player"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "discard", target: 0, amount: 2 }, { kind: "scry", amount: 2 }],
  },
});
