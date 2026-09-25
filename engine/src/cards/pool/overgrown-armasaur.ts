import { defineCard } from "../define.js";

export default defineCard({
  name: "Overgrown Armasaur",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 4,
  toughness: 4,
  text: "Enrage — Whenever this creature is dealt damage, create a 1/1 green Saproling creature token.",
  triggered: [
    {
      trigger: { on: "dealt-damage", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Saproling Token", count: 1 },
      resolve: null,
      text: "Enrage — Whenever this creature is dealt damage, create a 1/1 green Saproling creature token.",
    },
  ],
});
