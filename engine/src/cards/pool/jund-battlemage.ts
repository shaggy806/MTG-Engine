import { defineCard } from "../define.js";

export default defineCard({
  name: "Jund Battlemage",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 2,
  toughness: 2,
  text: "{B}, {T}: Target player loses 1 life.\n{G}, {T}: Create a 1/1 green Saproling creature token.",
  activated: [
    {
      cost: { mana: "{B}", tap: true },
      targets: ["player"],
      effect: { kind: "lose-life", amount: 1, target: 0 },
      resolve: null,
      text: "{B}, {T}: Target player loses 1 life.",
    },
    {
      cost: { mana: "{G}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Saproling Token", count: 1 },
      resolve: null,
      text: "{G}, {T}: Create a 1/1 green Saproling creature token.",
    },
  ],
});
