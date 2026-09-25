import { defineCard } from "../define.js";

export default defineCard({
  name: "Disperse",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Return target nonland permanent to its owner's hand.",
  targets: ["nonland-permanent"],
  effect: { kind: "return-to-hand", target: 0 },
});
