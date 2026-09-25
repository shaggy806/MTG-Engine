import { defineCard } from "../define.js";

export default defineCard({
  name: "Scream Puff",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Horror"],
  power: 4,
  toughness: 5,
  keywords: ["deathtouch"],
  text: "Deathtouch\nWhenever this creature deals combat damage to a player, create a Food token. (It's an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")",
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
