import { defineCard } from "../define.js";

export default defineCard({
  name: "Doom Blade",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Destroy target nonblack creature.",
  targets: ["nonblack-creature"],
  effect: { kind: "destroy", target: 0 },
});
