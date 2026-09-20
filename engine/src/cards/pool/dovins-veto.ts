import { defineCard } from "../define.js";

export default defineCard({
  name: "Dovin's Veto",
  manaCost: "{W}{U}",
  colors: ["W", "U"],
  types: ["instant"],
  text: "This spell can't be countered.\nCounter target noncreature spell.",
  cantBeCountered: true,
  targets: ["noncreature-spell"],
  effect: { kind: "counter", target: 0 },
});
