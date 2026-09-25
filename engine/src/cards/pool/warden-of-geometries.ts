import { defineCard } from "../define.js";

export default defineCard({
  name: "Warden of Geometries",
  manaCost: "{4}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi", "Drone"],
  power: 2,
  toughness: 3,
  keywords: ["vigilance"],
  text: "Vigilance\n{T}: Add {C}. ({C} represents colorless mana.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
  ],
});
