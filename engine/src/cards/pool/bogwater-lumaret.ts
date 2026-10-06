import { defineCard } from "../define.js";

const TEXT = "Whenever this creature or another creature you control enters, you gain 1 life.";

// Verdant Sun's Avatar's shape: one trigger for itself and every other
// creature you control entering.
export default defineCard({
  name: "Bogwater Lumaret",
  manaCost: "{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Spirit", "Frog"],
  power: 2,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
