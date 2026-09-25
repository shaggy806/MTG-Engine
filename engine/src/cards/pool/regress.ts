import { defineCard } from "../define.js";

export default defineCard({
  name: "Regress",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Return target permanent to its owner's hand.",
  targets: ["permanent"],
  effect: { kind: "return-to-hand", target: 0 },
});
