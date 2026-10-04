import { defineCard } from "../define.js";

// EDHREC rank 3003.
//
// Rulings:
//   [2022-12-08] Arcanis's last ability can be activated only while it's on the battlefield.

export default defineCard({
  name: "Arcanis the Omnipotent",
  manaCost: "{3}{U}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Wizard"],
  power: 3,
  toughness: 4,
  text: "{T}: Draw three cards.\n{2}{U}{U}: Return Arcanis to its owner's hand.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "draw", amount: 3 },
      resolve: null,
      text: "{T}: Draw three cards.",
    },
    {
      cost: { mana: "{2}{U}{U}", tap: false },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: "{2}{U}{U}: Return Arcanis to its owner's hand.",
    },
  ],
});
