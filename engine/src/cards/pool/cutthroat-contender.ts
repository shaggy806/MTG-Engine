import { defineCard } from "../define.js";

export default defineCard({
  name: "Cutthroat Contender",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Warrior"],
  power: 1,
  toughness: 1,
  text: "Pay 1 life: This creature gets +1/+0 until end of turn. Activate only once each turn.",
  activated: [
    {
      cost: { mana: null, tap: false, payLife: 1 },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "Pay 1 life: This creature gets +1/+0 until end of turn. Activate only once each turn.",
      oncePerTurn: true,
    },
  ],
});
