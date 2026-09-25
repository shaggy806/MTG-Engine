import { defineCard } from "../define.js";

export default defineCard({
  name: "Volcanic Upheaval",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Destroy target land.",
  targets: ["land"],
  effect: { kind: "destroy", target: 0 },
});
