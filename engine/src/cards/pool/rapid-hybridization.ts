import { defineCard } from "../define.js";

export default defineCard({
  name: "Rapid Hybridization",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Destroy target creature. It can't be regenerated. That creature's " +
    "controller creates a 3/3 green Frog Lizard creature token.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0, cantBeRegenerated: true },
      { kind: "create-token", token: "Frog Lizard Token", count: 1, who: "target-controller" },
    ],
  },
});
