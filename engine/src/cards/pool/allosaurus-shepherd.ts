import { defineCard } from "../define.js";

const UNCOUNTERABLE_TEXT = "Green spells you control can't be countered.";
const ANIMATE_TEXT =
  "{4}{G}{G}: Until end of turn, each Elf creature you control has base power and toughness 5/5 and becomes a Dinosaur in addition to its other creature types.";

// The Elves are fixed as it resolves; they keep their abilities, and later
// P/T-setting effects overwrite this one (the rulings).
export default defineCard({
  name: "Allosaurus Shepherd",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman"],
  power: 1,
  toughness: 1,
  cantBeCountered: true,
  text: `This spell can't be countered.\n${UNCOUNTERABLE_TEXT}\n${ANIMATE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      grantsToSpells: { filter: { colors: ["G"] }, cantBeCountered: true },
      text: UNCOUNTERABLE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{4}{G}{G}", tap: false },
      targets: [],
      effect: {
        kind: "animate-all",
        filter: { type: "creature", subtype: "Elf", controlledBy: "you" },
        power: 5,
        toughness: 5,
        addSubtypes: ["Dinosaur"],
        duration: "end-of-turn",
      },
      resolve: null,
      text: ANIMATE_TEXT,
    },
  ],
});
