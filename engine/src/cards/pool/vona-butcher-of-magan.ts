import { defineCard } from "../define.js";

export default defineCard({
  name: "Vona, Butcher of Magan",
  manaCost: "{3}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Knight"],
  power: 4,
  toughness: 4,
  keywords: ["vigilance", "lifelink"],
  text: "Vigilance, lifelink\n{T}, Pay 7 life: Destroy target nonland permanent. Activate only during your turn.",
  activated: [
    {
      cost: { mana: null, tap: true, payLife: 7 },
      targets: ["nonland-permanent"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{T}, Pay 7 life: Destroy target nonland permanent. Activate only during your turn.",
      condition: { kind: "your-turn" },
    },
  ],
});
