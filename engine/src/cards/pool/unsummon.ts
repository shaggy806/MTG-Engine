import { defineCard } from "../define.js";

export default defineCard({
  name: "Unsummon",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Return target creature to its owner's hand.",
  targets: ["creature"],
  effect: { kind: "return-to-hand", target: 0 },
});
