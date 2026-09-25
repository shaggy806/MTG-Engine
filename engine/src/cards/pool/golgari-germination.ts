import { defineCard } from "../define.js";

export default defineCard({
  name: "Golgari Germination",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  types: ["enchantment"],
  text: "Whenever a nontoken creature you control dies, create a 1/1 green Saproling creature token.",
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { token: false, type: "creature" } },
      targets: [],
      effect: { kind: "create-token", token: "Saproling Token", count: 1 },
      resolve: null,
      text: "Whenever a nontoken creature you control dies, create a 1/1 green Saproling creature token.",
    },
  ],
});
