import { defineCard } from "../define.js";

export default defineCard({
  name: "Artificial Evolution",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Change the text of target creature by replacing all instances of one creature type with another. The new creature type can't be Wall.",
  targets: ["creature"],
  effect: { kind: "change-text", target: 0 },
});
