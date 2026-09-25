import { defineCard } from "../define.js";

export default defineCard({
  name: "Ferrous Lake",
  colors: [],
  types: ["land"],
  text: "{1}, {T}: Add {U}{R}.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { all: ["U", "R"] }, amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add {U}{R}.",
    },
  ],
});
