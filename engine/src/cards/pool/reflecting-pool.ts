import { defineCard } from "../define.js";

const TEXT = "{T}: Add one mana of any type that a land you control could produce.";

// "Any type": colorless counts (rule 106.1b). What each land could produce is
// rule 106.7's — every type its mana abilities would make, their costs
// ignored (a tapped land counts), and two Reflecting Pools don't help each
// other (the rulings). No restriction or rider of the other land's comes
// with it.
export default defineCard({
  name: "Reflecting Pool",
  types: ["land"],
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { producedBy: "your-lands", anyType: true }, amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
