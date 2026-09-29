import { defineCard } from "../define.js";

const UNCOUNTERABLE_TEXT = "Creature and enchantment spells you control can't be countered.";
const ANIMATE_TEXT =
  "{3}{G}: Target land you control becomes an X/X Elemental creature with trample and haste until end of turn, where X is the number of enchantments you control. It's still a land.";

// X is read once, as the ability resolves, and stays (the ruling); with no
// enchantments the land becomes a 0/0.
export default defineCard({
  name: "Destiny Spinner",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment", "creature"],
  subtypes: ["Human"],
  power: 2,
  toughness: 3,
  text: `${UNCOUNTERABLE_TEXT}\n${ANIMATE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      grantsToSpells: { filter: { typesAnyOf: ["creature", "enchantment"] }, cantBeCountered: true },
      text: UNCOUNTERABLE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{3}{G}", tap: false },
      targets: ["land-you-control"],
      effect: {
        kind: "animate",
        target: 0,
        power: { countOf: { type: "enchantment", controlledBy: "you" } },
        toughness: { countOf: { type: "enchantment", controlledBy: "you" } },
        addTypes: ["creature"],
        addSubtypes: ["Elemental"],
        keywords: ["trample", "haste"],
        duration: "end-of-turn",
      },
      resolve: null,
      text: ANIMATE_TEXT,
    },
  ],
});
