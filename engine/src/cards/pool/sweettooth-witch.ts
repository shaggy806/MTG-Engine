import { defineCard } from "../define.js";

export default defineCard({
  name: "Sweettooth Witch",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Warlock"],
  power: 3,
  toughness: 2,
  text: "When this creature enters, create a Food token. (It's an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")\n{2}, Sacrifice a Food: Target player loses 2 life.",
  activated: [
    {
      cost: { mana: "{2}", tap: false, sacrifice: { filter: { subtype: "Food" } } },
      targets: ["player"],
      effect: { kind: "lose-life", amount: 2, target: 0 },
      resolve: null,
      text: "{2}, Sacrifice a Food: Target player loses 2 life.",
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
