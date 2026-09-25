import { defineCard } from "../define.js";

export default defineCard({
  name: "Keeper of the Nine Gales",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird", "Wizard"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{T}, Tap two untapped Birds you control: Return target permanent to its owner's hand.",
  activated: [
    {
      cost: {
        mana: null,
        tap: true,
        tapOthers: { count: 2, filter: { subtype: "Bird", controlledBy: "you" } },
      },
      targets: ["permanent"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: "{T}, Tap two untapped Birds you control: Return target permanent to its owner's hand.",
    },
  ],
});
