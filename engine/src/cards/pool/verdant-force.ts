import { defineCard } from "../define.js";

export default defineCard({
  name: "Verdant Force",
  manaCost: "{5}{G}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 7,
  toughness: 7,
  text: "At the beginning of each upkeep, create a 1/1 green Saproling creature token.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "any" },
      targets: [],
      effect: { kind: "create-token", token: "Saproling Token", count: 1 },
      resolve: null,
      text: "At the beginning of each upkeep, create a 1/1 green Saproling creature token.",
    },
  ],
});
