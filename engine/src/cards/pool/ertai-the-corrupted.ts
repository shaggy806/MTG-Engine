import { defineCard } from "../define.js";

export default defineCard({
  name: "Ertai, the Corrupted",
  manaCost: "{2}{W}{U}{B}",
  colors: ["W", "U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Human", "Wizard"],
  power: 3,
  toughness: 4,
  text: "{U}, {T}, Sacrifice a creature or enchantment: Counter target spell.",
  activated: [
    {
      cost: {
        mana: "{U}",
        tap: true,
        sacrifice: { filter: { typesAnyOf: ["creature", "enchantment"] } },
      },
      targets: ["spell"],
      effect: { kind: "counter", target: 0 },
      resolve: null,
      text: "{U}, {T}, Sacrifice a creature or enchantment: Counter target spell.",
    },
  ],
});
