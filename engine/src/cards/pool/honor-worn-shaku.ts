import { defineCard } from "../define.js";

export default defineCard({
  name: "Honor-Worn Shaku",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {C}.\nTap an untapped legendary permanent you control: Untap this artifact.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: {
          count: 1,
          filter: { supertype: "legendary", controlledBy: "you" },
          includeSelf: true,
        },
      },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "Tap an untapped legendary permanent you control: Untap this artifact.",
    },
  ],
});
