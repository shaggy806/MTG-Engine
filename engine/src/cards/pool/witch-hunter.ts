import { defineCard } from "../define.js";

export default defineCard({
  name: "Witch Hunter",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 1,
  text: "{T}: This creature deals 1 damage to target player or planeswalker.\n{1}{W}{W}, {T}: Return target creature an opponent controls to its owner's hand.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["player-or-planeswalker"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{T}: This creature deals 1 damage to target player or planeswalker.",
    },
    {
      cost: { mana: "{1}{W}{W}", tap: true },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: "{1}{W}{W}, {T}: Return target creature an opponent controls to its owner's hand.",
    },
  ],
});
