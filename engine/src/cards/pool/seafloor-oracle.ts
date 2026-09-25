import { defineCard } from "../define.js";

export default defineCard({
  name: "Seafloor Oracle",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard"],
  power: 2,
  toughness: 3,
  text: "Whenever a Merfolk you control deals combat damage to a player, draw a card.",
  triggered: [
    {
      trigger: {
        on: "deals-combat-damage-to-player",
        who: "you-control",
        filter: { subtype: "Merfolk" },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever a Merfolk you control deals combat damage to a player, draw a card.",
    },
  ],
});
