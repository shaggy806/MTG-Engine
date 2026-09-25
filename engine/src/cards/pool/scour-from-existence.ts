import { defineCard } from "../define.js";

export default defineCard({
  name: "Scour from Existence",
  manaCost: "{7}",
  colors: [],
  types: ["instant"],
  text: "Exile target permanent.",
  targets: ["permanent"],
  effect: { kind: "exile", target: 0 },
});
