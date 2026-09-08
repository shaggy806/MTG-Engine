import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 10 — energy ({E}, rule 122). It gets energy when it connects,
 * and spends energy to grow.
 */
export default defineCard({
  name: "Longtusk Cub",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Cat"],
  power: 2,
  toughness: 2,
  text: "Whenever Longtusk Cub deals combat damage to a player, you get {E}{E}.\nPay {E}{E}: Put a +1/+1 counter on Longtusk Cub.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "get-energy", amount: 2 },
      resolve: null,
      text: "Whenever Longtusk Cub deals combat damage to a player, you get {E}{E}.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, payEnergy: 2 },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Pay {E}{E}: Put a +1/+1 counter on Longtusk Cub.",
    },
  ],
});
