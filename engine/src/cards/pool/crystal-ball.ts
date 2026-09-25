import { defineCard } from "../define.js";

export default defineCard({
  name: "Crystal Ball",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{1}, {T}: Scry 2. (Look at the top two cards of your library, then put any number of them on the bottom and the rest on top in any order.)",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "scry", amount: 2 },
      resolve: null,
      text: "{1}, {T}: Scry 2.",
    },
  ],
});
