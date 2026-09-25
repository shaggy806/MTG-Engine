import { defineCard } from "../define.js";

export default defineCard({
  name: "Desolate Mire",
  colors: [],
  types: ["land"],
  text: "{1}, {T}: Add {W}{B}.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { all: ["W", "B"] }, amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add {W}{B}.",
    },
  ],
});
