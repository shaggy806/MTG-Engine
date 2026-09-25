import { defineCard } from "../define.js";

export default defineCard({
  name: "Shivan Gorge",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text: "{T}: Add {C}.\n{2}{R}, {T}: Shivan Gorge deals 1 damage to each opponent.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{2}{R}", tap: true },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "{2}{R}, {T}: Shivan Gorge deals 1 damage to each opponent.",
    },
  ],
});
