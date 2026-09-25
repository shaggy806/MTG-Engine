import { defineCard } from "../define.js";

export default defineCard({
  name: "Dakmor Lancer",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 3,
  toughness: 3,
  text: "When this creature enters, destroy target nonblack creature.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["nonblack-creature"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "When this creature enters, destroy target nonblack creature.",
    },
  ],
});
