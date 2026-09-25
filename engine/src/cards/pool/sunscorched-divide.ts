import { defineCard } from "../define.js";

export default defineCard({
  name: "Sunscorched Divide",
  colors: [],
  types: ["land"],
  text: "{1}, {T}: Add {R}{W}.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { all: ["R", "W"] }, amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add {R}{W}.",
    },
  ],
});
