import { defineCard } from "../define.js";

export default defineCard({
  name: "Claws of Gix",
  manaCost: "{0}",
  colors: [],
  types: ["artifact"],
  text: "{1}, Sacrifice a permanent: You gain 1 life.",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: { filter: {} } },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "{1}, Sacrifice a permanent: You gain 1 life.",
    },
  ],
});
