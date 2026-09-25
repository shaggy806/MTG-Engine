import { defineCard } from "../define.js";

export default defineCard({
  name: "Ravenous Lindwurm",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wurm"],
  power: 6,
  toughness: 6,
  text: "When this creature enters, you gain 4 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 4 },
      resolve: null,
      text: "When this creature enters, you gain 4 life.",
    },
  ],
});
