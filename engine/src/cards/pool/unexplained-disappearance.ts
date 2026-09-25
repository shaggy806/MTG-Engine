import { defineCard } from "../define.js";

export default defineCard({
  name: "Unexplained Disappearance",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Return target creature to its owner's hand.\nSurveil 1. (Look at the top card of your library. You may put that card into your graveyard.)",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "return-to-hand", target: 0 }, { kind: "surveil", amount: 1 }],
  },
});
