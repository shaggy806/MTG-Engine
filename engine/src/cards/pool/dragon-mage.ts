import { defineCard } from "../define.js";

export default defineCard({
  name: "Dragon Mage",
  manaCost: "{5}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon", "Wizard"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying\nWhenever this creature deals combat damage to a player, each player discards their hand, then draws seven cards.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      // The damaged player fills the first slot of a
      // `deals-combat-damage-to-player` trigger automatically, but this
      // ability doesn't care who it was — it hits the whole table.
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "discard-hand", who: "each-player" },
          { kind: "draw", amount: 7, who: "each-player" },
        ],
      },
      resolve: null,
      text: "Whenever this creature deals combat damage to a player, each player discards their hand, then draws seven cards.",
    },
  ],
});
