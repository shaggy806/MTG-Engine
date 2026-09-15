import { defineCard } from "../define.js";

export default defineCard({
  name: "Stroke of Midnight",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Destroy target nonland permanent. Its controller creates a 1/1 white Human creature token.",
  targets: ["nonland-permanent"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      { kind: "create-token", token: "Human Token", count: 1, who: "target-controller" },
    ],
  },
});
