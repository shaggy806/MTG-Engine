import { defineCard } from "../define.js";

export default defineCard({
  name: "Desert Twister",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Destroy target permanent.",
  targets: ["permanent"],
  effect: { kind: "destroy", target: 0 },
});
