import { defineCard } from "../define.js";

export default defineCard({
  name: "Drag Under",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Return target creature to its owner's hand.\nDraw a card.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "return-to-hand", target: 0 }, { kind: "draw", amount: 1 }],
  },
});
