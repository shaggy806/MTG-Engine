import { defineCard } from "../define.js";

export default defineCard({
  name: "Leyline Prowler",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Nightmare", "Beast"],
  power: 2,
  toughness: 3,
  keywords: ["deathtouch", "lifelink"],
  text: "Deathtouch, lifelink\n{T}: Add one mana of any color.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
  ],
});
