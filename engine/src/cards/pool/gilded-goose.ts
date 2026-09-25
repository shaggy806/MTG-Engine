import { defineCard } from "../define.js";

export default defineCard({
  name: "Gilded Goose",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 0,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, create a Food token. (It's an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")\n{1}{G}, {T}: Create a Food token.\n{T}, Sacrifice a Food: Add one mana of any color.",
  activated: [
    {
      cost: { mana: "{1}{G}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: "{1}{G}, {T}: Create a Food token.",
    },
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { subtype: "Food" } } },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}, Sacrifice a Food: Add one mana of any color.",
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
