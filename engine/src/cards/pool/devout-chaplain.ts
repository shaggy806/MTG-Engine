import { defineCard } from "../define.js";

export default defineCard({
  name: "Devout Chaplain",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 2,
  toughness: 2,
  text: "{T}, Tap two untapped Humans you control: Exile target artifact or enchantment.",
  activated: [
    {
      cost: {
        mana: null,
        tap: true,
        tapOthers: { count: 2, filter: { subtype: "Human", controlledBy: "you" } },
      },
      targets: ["artifact-or-enchantment"],
      effect: { kind: "exile", target: 0 },
      resolve: null,
      text: "{T}, Tap two untapped Humans you control: Exile target artifact or enchantment.",
    },
  ],
});
