import { defineCard } from "../define.js";

export default defineCard({
  name: "Viridescent Bog",
  colors: [],
  types: ["land"],
  text: "{1}, {T}: Add {B}{G}.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { all: ["B", "G"] }, amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add {B}{G}.",
    },
  ],
});
