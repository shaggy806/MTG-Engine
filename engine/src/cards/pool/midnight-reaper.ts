import { defineCard } from "../define.js";

export default defineCard({
  name: "Midnight Reaper",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Knight"],
  power: 3,
  toughness: 2,
  text:
    "Whenever a nontoken creature you control dies, Midnight Reaper deals 1 damage " +
    "to you and you draw a card.",
  triggered: [
    {
      trigger: {
        on: "dies",
        who: "you-control",
        filter: { type: "creature", token: false },
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "damage", amount: 1, who: "you" },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text:
        "Whenever a nontoken creature you control dies, Midnight Reaper deals 1 damage " +
        "to you and you draw a card.",
    },
  ],
});
