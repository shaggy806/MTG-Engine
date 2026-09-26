import { defineCard } from "../define.js";

const TEXT = "{T}: Put a +1/+1 counter on each artifact creature you control.";

export default defineCard({
  name: "Steel Overseer",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 1,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { types: ["artifact", "creature"], controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
