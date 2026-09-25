import { defineCard } from "../define.js";

export default defineCard({
  name: "Verdigris",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Destroy target artifact.",
  targets: ["artifact"],
  effect: { kind: "destroy", target: 0 },
});
