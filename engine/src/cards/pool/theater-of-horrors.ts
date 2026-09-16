import { defineCard } from "../define.js";

export default defineCard({
  name: "Theater of Horrors",
  manaCost: "{1}{B}{R}",
  colors: ["B", "R"],
  types: ["enchantment"],
  text:
    "At the beginning of your upkeep, exile the top card of your library.\n" +
    "During your turn, if an opponent lost life this turn, you may play lands and cast spells from among cards exiled with this enchantment.\n" +
    "{3}{R}: This enchantment deals 1 damage to target opponent or planeswalker.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "impulse-exile",
        amount: 1,
        // The permission lasts as long as the enchantment does, and is gated
        // on the turn and the life-loss clause every time it's checked.
        duration: "while-source",
        yourTurnOnly: true,
        gate: { kind: "opponent-lost-life-this-turn" },
      },
      resolve: null,
      text: "At the beginning of your upkeep, exile the top card of your library.",
    },
  ],
  activated: [
    {
      cost: { mana: "{3}{R}", tap: false },
      targets: ["opponent-or-planeswalker"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{3}{R}: This enchantment deals 1 damage to target opponent or planeswalker.",
    },
  ],
});
