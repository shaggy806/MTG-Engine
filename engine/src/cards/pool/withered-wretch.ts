import { defineCard } from "../define.js";

export default defineCard({
  name: "Withered Wretch",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Cleric"],
  power: 2,
  toughness: 2,
  text: "{1}: Exile target card from a graveyard.",
  activated: [
    {
      cost: { mana: "{1}", tap: false },
      targets: [{ kind: "card-in-graveyard" }],
      effect: { kind: "exile", target: 0 },
      resolve: null,
      text: "{1}: Exile target card from a graveyard.",
    },
  ],
});
