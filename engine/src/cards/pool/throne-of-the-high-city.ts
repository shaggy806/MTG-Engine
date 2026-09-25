import { defineCard } from "../define.js";

export default defineCard({
  name: "Throne of the High City",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{4}, {T}, Sacrifice this land: You become the monarch.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{4}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "become-monarch" },
      resolve: null,
      text: "{4}, {T}, Sacrifice this land: You become the monarch.",
    },
  ],
});
