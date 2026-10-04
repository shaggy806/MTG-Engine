import { defineCard } from "../define.js";

// EDHREC rank 6385.
// "An opponent controls a green permanent": `opponent-controls` counts per
// opponent (Ghostfire Slice's shape).

export default defineCard({
  name: "Oakhame Adversary",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 2,
  toughness: 3,
  keywords: ["deathtouch"],
  text: "This spell costs {2} less to cast if an opponent controls a green permanent.\nDeathtouch\nWhenever this creature deals combat damage to a player, draw a card.",
  selfCostReduction: {
    condition: { kind: "opponent-controls", filter: { colors: ["G"] }, atLeast: 1 },
    reduceGeneric: 2,
  },
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever this creature deals combat damage to a player, draw a card.",
    },
  ],
});
