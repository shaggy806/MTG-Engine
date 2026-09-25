import { defineCard } from "../define.js";

export default defineCard({
  name: "Putrid Leech",
  manaCost: "{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Zombie", "Leech"],
  power: 2,
  toughness: 2,
  text: "Pay 2 life: This creature gets +2/+2 until end of turn. Activate only once each turn.",
  activated: [
    {
      cost: { mana: null, tap: false, payLife: 2 },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "Pay 2 life: This creature gets +2/+2 until end of turn. Activate only once each turn.",
      oncePerTurn: true,
    },
  ],
});
