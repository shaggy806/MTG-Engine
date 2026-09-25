import { defineCard } from "../define.js";

export default defineCard({
  name: "Deadly Visit",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Destroy target creature.\nSurveil 2. (Look at the top two cards of your library, then put any number of them into your graveyard and the rest on top of your library in any order.)",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "destroy", target: 0 }, { kind: "surveil", amount: 2 }],
  },
});
