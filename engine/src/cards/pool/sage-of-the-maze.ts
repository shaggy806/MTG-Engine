import { defineCard } from "../define.js";

// EDHREC rank 5727.
//
// Rulings:
//   [2024-06-07] The value of X is calculated only once, as Sage of the Maze's second ability
//     resolves.

const ANIMATE_TEXT =
  "{T}: Until end of turn, target land you control becomes an X/X Citizen creature with haste in addition to its other types, where X is twice the number of Gates you control. Activate only as a sorcery.";

export default defineCard({
  name: "Sage of the Maze",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Wizard"],
  power: 1,
  toughness: 3,
  text: `{T}: Add two mana in any combination of colors.\n${ANIMATE_TEXT}\nTap an untapped Gate you control: Untap this creature.`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["W", "U", "B", "R", "G"] }, amount: 2 },
      resolve: null,
      text: "{T}: Add two mana in any combination of colors.",
    },
    {
      cost: { mana: null, tap: true },
      targets: ["land-you-control"],
      // X is read once, as the ability resolves (the ruling).
      effect: {
        kind: "animate",
        target: 0,
        power: { countOf: { subtype: "Gate", controlledBy: "you" }, times: 2 },
        toughness: { countOf: { subtype: "Gate", controlledBy: "you" }, times: 2 },
        addTypes: ["creature"],
        addSubtypes: ["Citizen"],
        keywords: ["haste"],
        duration: "end-of-turn",
      },
      resolve: null,
      text: ANIMATE_TEXT,
      sorcerySpeed: true,
    },
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 1, filter: { subtype: "Gate", controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "Tap an untapped Gate you control: Untap this creature.",
    },
  ],
});
