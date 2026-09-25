import { defineCard } from "../define.js";

export default defineCard({
  name: "Nuka-Cola Vending Machine",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{1}, {T}: Create a Food token. (It's an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")\nWhenever you sacrifice a Food, create a tapped Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: "{1}, {T}: Create a Food token.",
    },
  ],
  triggered: [
    {
      trigger: { on: "sacrifice", who: "you", filter: { subtype: "Food" } },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1, tapped: true },
      resolve: null,
      text: "Whenever you sacrifice a Food, create a tapped Treasure token.",
    },
  ],
});
