import { defineCard } from "../define.js";

export default defineCard({
  name: "Ant Queen",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 5,
  toughness: 5,
  text: "{1}{G}: Create a 1/1 green Insect creature token.",
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Insect Token", count: 1 },
      resolve: null,
      text: "{1}{G}: Create a 1/1 green Insect creature token.",
    },
  ],
});
