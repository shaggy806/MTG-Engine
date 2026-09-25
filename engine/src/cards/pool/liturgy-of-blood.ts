import { defineCard } from "../define.js";

export default defineCard({
  name: "Liturgy of Blood",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Destroy target creature. Add {B}{B}{B}.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "destroy", target: 0 }, { kind: "add-mana", mana: "B", amount: 3 }],
  },
});
