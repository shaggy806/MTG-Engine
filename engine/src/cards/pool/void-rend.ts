import { defineCard } from "../define.js";

export default defineCard({
  name: "Void Rend",
  manaCost: "{W}{U}{B}",
  colors: ["W", "U", "B"],
  types: ["instant"],
  cantBeCountered: true,
  text: "This spell can't be countered.\nDestroy target nonland permanent.",
  targets: ["nonland-permanent"],
  effect: { kind: "destroy", target: 0 },
});
