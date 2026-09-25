import { defineCard } from "../define.js";

export default defineCard({
  name: "Vindicate",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  types: ["sorcery"],
  text: "Destroy target permanent.",
  targets: ["permanent"],
  effect: { kind: "destroy", target: 0 },
});
