import { defineCard } from "../define.js";

export default defineCard({
  name: "Throne of Geth",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "{T}, Sacrifice an artifact: Proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { type: "artifact" } } },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: "{T}, Sacrifice an artifact: Proliferate.",
    },
  ],
});
