import { defineCard } from "../define.js";

export default defineCard({
  name: "Last Word",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  cantBeCountered: true,
  text: "This spell can't be countered.\nCounter target spell.",
  targets: ["spell"],
  effect: { kind: "counter", target: 0 },
});
