import { defineCard } from "../define.js";

export default defineCard({
  name: "Desolation Prowler",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Wolf"],
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
