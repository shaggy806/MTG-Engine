import { defineCard } from "../define.js";

export default defineCard({
  name: "Eager Trufflesnout",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Boar"],
  power: 4,
  toughness: 2,
  keywords: ["trample"],
  text: "Trample (This creature can deal excess combat damage to the player or planeswalker it's attacking.)\nWhenever this creature deals combat damage to a player, create a Food token. (It's an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: "Whenever this creature deals combat damage to a player, create a Food token.",
    },
  ],
});
