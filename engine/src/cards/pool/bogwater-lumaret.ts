import { defineCard } from "../define.js";
import { thisOrAnother } from "../helpers.js";

const TEXT = "Whenever this creature or another creature you control enters, you gain 1 life.";

// Verdant Sun's Avatar's shape: a trigger for itself, whatever it is then,
// and one for every other creature you control entering (`thisOrAnother`).
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
    ...thisOrAnother({
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: TEXT,
    }),
  ],
});
