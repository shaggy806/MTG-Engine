import { defineCard } from "../define.js";

export default defineCard({
  name: "Doom Whisperer",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Nightmare", "Demon"],
  power: 6,
  toughness: 6,
  keywords: ["flying", "trample"],
  text: "Flying, trample\nPay 2 life: Surveil 2. (Look at the top two cards of your library, then put any number of them into your graveyard and the rest on top of your library in any order.)",
  activated: [
    {
      cost: { mana: null, tap: false, payLife: 2 },
      targets: [],
      effect: { kind: "surveil", amount: 2 },
      resolve: null,
      text: "Pay 2 life: Surveil 2.",
    },
  ],
});
