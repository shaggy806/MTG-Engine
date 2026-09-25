import { defineCard } from "../define.js";

export default defineCard({
  name: "Tunneling Geopede",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 3,
  toughness: 2,
  text: "Landfall — Whenever a land you control enters, this creature deals 1 damage to each opponent.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, this creature deals 1 damage to each opponent.",
    },
  ],
});
