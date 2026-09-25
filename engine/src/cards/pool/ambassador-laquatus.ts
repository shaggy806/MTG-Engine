import { defineCard } from "../define.js";

export default defineCard({
  name: "Ambassador Laquatus",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard"],
  power: 1,
  toughness: 3,
  text: "{3}: Target player mills three cards.",
  activated: [
    {
      cost: { mana: "{3}", tap: false },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 3 },
      resolve: null,
      text: "{3}: Target player mills three cards.",
    },
  ],
});
