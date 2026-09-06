import { defineCard } from "../define.js";

export default defineCard({
  name: "Counterspell",
  manaCost: "{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target spell.",
  targets: ["spell"],
  effect: { kind: "counter", target: 0 },
});
