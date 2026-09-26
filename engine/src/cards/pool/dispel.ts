import { defineCard } from "../define.js";

export default defineCard({
  name: "Dispel",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target instant spell.",
  targets: [{ kind: "spell", filter: { type: "instant" } }],
  effect: { kind: "counter", target: 0 },
});
