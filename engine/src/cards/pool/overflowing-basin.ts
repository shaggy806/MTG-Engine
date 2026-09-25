import { defineCard } from "../define.js";

export default defineCard({
  name: "Overflowing Basin",
  colors: [],
  types: ["land"],
  text: "{1}, {T}: Add {G}{U}.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { all: ["G", "U"] }, amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add {G}{U}.",
    },
  ],
});
