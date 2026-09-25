import { defineCard } from "../define.js";

export default defineCard({
  name: "Caustic Rain",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Exile target land.",
  targets: ["land"],
  effect: { kind: "exile", target: 0 },
});
