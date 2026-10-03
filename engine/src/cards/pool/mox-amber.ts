import { defineCard } from "../define.js";

const TEXT = "{T}: Add one mana of any color among legendary creatures and planeswalkers you control.";

// One mana of one of those colours, read as it's tapped (the ruling: not one
// of each). None of them coloured — or none at all — and it can still be
// tapped, for nothing (rule 106.5).
export default defineCard({
  name: "Mox Amber",
  manaCost: "{0}",
  supertypes: ["legendary"],
  types: ["artifact"],
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: {
          colorAmong: { typesAnyOf: ["creature", "planeswalker"], supertype: "legendary", controlledBy: "you" },
        },
        amount: 1,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
