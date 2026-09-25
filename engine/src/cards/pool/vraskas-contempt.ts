import { defineCard } from "../define.js";

export default defineCard({
  name: "Vraska's Contempt",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Exile target creature or planeswalker. You gain 2 life.",
  targets: [{ kind: "permanent", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  effect: {
    kind: "sequence",
    effects: [{ kind: "exile", target: 0 }, { kind: "gain-life", amount: 2 }],
  },
});
