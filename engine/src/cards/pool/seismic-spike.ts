import { defineCard } from "../define.js";

export default defineCard({
  name: "Seismic Spike",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Destroy target land. Add {R}{R}.",
  targets: ["land"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "destroy", target: 0 }, { kind: "add-mana", mana: "R", amount: 2 }],
  },
});
