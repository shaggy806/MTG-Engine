import { defineCard } from "../define.js";

// Jugan Defends the Temple // Remnant of the Rising Star's Human Monk token.

export default defineCard({
  name: "Human Monk Token",
  art: "86dd086e-c757-4a6a-8838-51860f2095f8",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Monk"],
  power: 1,
  toughness: 1,
  text: "{T}: Add {G}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{T}: Add {G}.",
    },
  ],
});
