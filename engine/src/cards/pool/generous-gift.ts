import { defineCard } from "../define.js";

// Beast Within in white — same shape, a 3/3 Elephant instead of a 3/3 Beast.
export default defineCard({
  name: "Generous Gift",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Destroy target permanent. Its controller creates a 3/3 green Elephant creature token.",
  targets: ["permanent"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      { kind: "create-token", token: "Elephant Token", count: 1, who: "target-controller" },
    ],
  },
});
