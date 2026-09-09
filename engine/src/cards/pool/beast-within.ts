import { defineCard } from "../define.js";

export default defineCard({
  name: "Beast Within",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Destroy target permanent. Its controller creates a 3/3 green Beast creature token.",
  targets: ["permanent"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      { kind: "create-token", token: "3/3 Beast Token", count: 1, who: "target-controller" },
    ],
  },
});
