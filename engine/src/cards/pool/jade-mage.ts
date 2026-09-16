import { defineCard } from "../define.js";

export default defineCard({
  name: "Jade Mage",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 2,
  toughness: 1,
  text: "{2}{G}: Create a 1/1 green Saproling creature token.",
  activated: [
    {
      cost: { mana: "{2}{G}", tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Saproling Token", count: 1 },
      resolve: null,
      text: "{2}{G}: Create a 1/1 green Saproling creature token.",
    },
  ],
});
