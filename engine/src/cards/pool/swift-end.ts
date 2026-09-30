import { defineCard } from "../define.js";

export default defineCard({
  name: "Swift End",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text:
    "Destroy target creature or planeswalker. You lose 2 life. (Then exile this card. You may cast the creature later from exile.)",
  targets: [{ kind: "permanent", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      { kind: "lose-life", amount: 2, who: "you" },
    ],
  },
  faces: ["Murderous Rider", "Swift End"],
  adventure: true,
});
