import { defineCard } from "../define.js";

export default defineCard({
  name: "Clock of Omens",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "Tap two untapped artifacts you control: Untap target artifact.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 2, filter: { type: "artifact", controlledBy: "you" }, includeSelf: true },
      },
      targets: ["artifact"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "Tap two untapped artifacts you control: Untap target artifact.",
    },
  ],
});
