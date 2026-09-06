import { defineCard } from "../define.js";

export default defineCard({
  name: "Negate",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target noncreature spell.",
  targets: ["noncreature-spell"],
  effect: { kind: "counter", target: 0 },
});
