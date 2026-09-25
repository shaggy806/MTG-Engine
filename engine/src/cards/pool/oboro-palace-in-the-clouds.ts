import { defineCard } from "../define.js";

export default defineCard({
  name: "Oboro, Palace in the Clouds",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text: "{T}: Add {U}.\n{1}: Return Oboro to its owner's hand.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "{T}: Add {U}.",
    },
    {
      cost: { mana: "{1}", tap: false },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: "{1}: Return Oboro to its owner's hand.",
    },
  ],
});
