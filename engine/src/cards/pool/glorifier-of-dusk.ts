import { defineCard } from "../define.js";

export default defineCard({
  name: "Glorifier of Dusk",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Vampire", "Soldier"],
  power: 4,
  toughness: 4,
  text: "Pay 2 life: This creature gains flying until end of turn.\nPay 2 life: This creature gains vigilance until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, payLife: 2 },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "Pay 2 life: This creature gains flying until end of turn.",
    },
    {
      cost: { mana: null, tap: false, payLife: 2 },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "vigilance",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Pay 2 life: This creature gains vigilance until end of turn.",
    },
  ],
});
