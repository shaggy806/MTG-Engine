import { defineCard } from "../define.js";

// EDHREC rank 2681.

const PLUS_TEXT = "+2: Create a 1/1 green Elf Druid creature token with \"{T}: Add {G}.\"";
const MINUS_TEXT = "−2: Destroy target artifact or enchantment.";
const ULT_TEXT = "−6: Draw a card for each green creature you control.";

export default defineCard({
  name: "Freyalise, Llanowar's Fury",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Freyalise"],
  loyalty: 3,
  canBeCommander: true,
  text: `${PLUS_TEXT}\n${MINUS_TEXT}\n${ULT_TEXT}\nFreyalise, Llanowar's Fury can be your commander.`,
  activated: [
    {
      loyaltyCost: 2,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Elf Druid Token", count: 1 },
      resolve: null,
      text: PLUS_TEXT,
    },
    {
      loyaltyCost: -2,
      cost: { mana: null, tap: false },
      targets: ["artifact-or-enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: MINUS_TEXT,
    },
    {
      loyaltyCost: -6,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "draw",
        amount: { countOf: { type: "creature", colors: ["G"], controlledBy: "you" } },
      },
      resolve: null,
      text: ULT_TEXT,
    },
  ],
});
