import { defineCard } from "../define.js";

export default defineCard({
  name: "Putrefy",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  types: ["instant"],
  text: "Destroy target artifact or creature. It can't be regenerated.",
  targets: ["artifact-or-creature"],
  effect: { kind: "destroy", target: 0, cantBeRegenerated: true },
});
