import { defineCard } from "../define.js";

export default defineCard({
  name: "Tempting Witch",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Warlock"],
  power: 1,
  toughness: 3,
  text: "When this creature enters, create a Food token. (It's an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")\n{2}, {T}, Sacrifice a Food: Target player loses 3 life.",
  activated: [
    {
      cost: { mana: "{2}", tap: true, sacrifice: { filter: { subtype: "Food" } } },
      targets: ["player"],
      effect: { kind: "lose-life", amount: 3, target: 0 },
      resolve: null,
      text: "{2}, {T}, Sacrifice a Food: Target player loses 3 life.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a Food token.",
    },
  ],
});
