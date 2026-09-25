import { defineCard } from "../define.js";

export default defineCard({
  name: "Finishing Blow",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Destroy target creature or planeswalker.",
  targets: [{ kind: "permanent", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  effect: { kind: "destroy", target: 0 },
});
