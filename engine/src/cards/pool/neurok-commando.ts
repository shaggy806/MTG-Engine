import { defineCard } from "../define.js";

export default defineCard({
  name: "Neurok Commando",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 2,
  toughness: 1,
  keywords: ["shroud"],
  text: "Shroud (This creature can't be the target of spells or abilities.)\nWhenever this creature deals combat damage to a player, you may draw a card.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: "Whenever this creature deals combat damage to a player, you may draw a card.",
    },
  ],
});
