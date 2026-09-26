import { defineCard } from "../define.js";

export default defineCard({
  name: "Abrupt Decay",
  manaCost: "{B}{G}",
  colors: ["B", "G"],
  types: ["instant"],
  text: "This spell can't be countered.\nDestroy target nonland permanent with mana value 3 or less.",
  cantBeCountered: true,
  targets: [{ kind: "permanent", filter: { notTypes: ["land"], manaValue: { op: "lte", n: 3 } } }],
  effect: { kind: "destroy", target: 0 },
});
