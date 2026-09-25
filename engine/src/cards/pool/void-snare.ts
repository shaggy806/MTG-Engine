import { defineCard } from "../define.js";

export default defineCard({
  name: "Void Snare",
  manaCost: "{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Return target nonland permanent to its owner's hand.",
  targets: ["nonland-permanent"],
  effect: { kind: "return-to-hand", target: 0 },
});
