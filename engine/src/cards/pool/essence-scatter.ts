import { defineCard } from "../define.js";

export default defineCard({
  name: "Essence Scatter",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target creature spell.",
  targets: ["creature-spell"],
  effect: { kind: "counter", target: 0 },
});
