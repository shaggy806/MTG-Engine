import { defineCard } from "../define.js";

export default defineCard({
  name: "Feed the Serpent",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Exile target creature or planeswalker.",
  targets: [{ kind: "permanent", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  effect: { kind: "exile", target: 0 },
});
