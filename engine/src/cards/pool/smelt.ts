import { defineCard } from "../define.js";

export default defineCard({
  name: "Smelt",
  manaCost: "{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Destroy target artifact.",
  targets: ["artifact"],
  effect: { kind: "destroy", target: 0 },
});
