import { defineCard } from "../define.js";

export default defineCard({
  name: "Mikokoro, Center of the Sea",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text: "{T}: Add {C}.\n{2}, {T}: Each player draws a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: { kind: "draw", amount: 1, who: "each-player" },
      resolve: null,
      text: "{2}, {T}: Each player draws a card.",
    },
  ],
});
