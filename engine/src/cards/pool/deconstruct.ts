import { defineCard } from "../define.js";

export default defineCard({
  name: "Deconstruct",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Destroy target artifact. Add {G}{G}{G}.",
  targets: ["artifact"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "destroy", target: 0 }, { kind: "add-mana", mana: "G", amount: 3 }],
  },
});
