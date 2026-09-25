import { defineCard } from "../define.js";

export default defineCard({
  name: "Eye of Nowhere",
  manaCost: "{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  subtypes: ["Arcane"],
  text: "Return target permanent to its owner's hand.",
  targets: ["permanent"],
  effect: { kind: "return-to-hand", target: 0 },
});
