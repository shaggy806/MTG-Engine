import { defineCard } from "../define.js";

export default defineCard({
  name: "Open the Graves",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text:
    "Whenever a nontoken creature you control dies, create a 2/2 black Zombie " +
    "creature token.",
  triggered: [
    {
      trigger: {
        on: "dies",
        who: "you-control",
        filter: { type: "creature", token: false },
      },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: 1 },
      resolve: null,
      text:
        "Whenever a nontoken creature you control dies, create a 2/2 black Zombie " +
        "creature token.",
    },
  ],
});
