import { defineCard } from "../define.js";

export default defineCard({
  name: "Selenia, Dark Angel",
  manaCost: "{3}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Angel"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nPay 2 life: Return Selenia to its owner's hand.",
  activated: [
    {
      cost: { mana: null, tap: false, payLife: 2 },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: "Pay 2 life: Return Selenia to its owner's hand.",
    },
  ],
});
