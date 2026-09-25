import { defineCard } from "../define.js";

export default defineCard({
  name: "Shatter",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Destroy target artifact.",
  targets: ["artifact"],
  effect: { kind: "destroy", target: 0 },
});
