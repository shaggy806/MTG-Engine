import { defineCard } from "../define.js";

export default defineCard({
  name: "Shattering Blow",
  manaCost: "{1}{R/W}",
  colors: ["W", "R"],
  types: ["instant"],
  text: "Exile target artifact.",
  targets: ["artifact"],
  effect: { kind: "exile", target: 0 },
});
