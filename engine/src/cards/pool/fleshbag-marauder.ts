import { defineCard } from "../define.js";

export default defineCard({
  name: "Fleshbag Marauder",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Warrior"],
  power: 3,
  toughness: 1,
  text:
    "When Fleshbag Marauder enters the battlefield, each player sacrifices a creature.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sacrifice",
        who: "each-player",
        filter: { type: "creature" },
        count: 1,
      },
      resolve: null,
      text: "When Fleshbag Marauder enters the battlefield, each player sacrifices a creature.",
    },
  ],
});
