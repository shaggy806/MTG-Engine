import { defineCard } from "../define.js";

// EDHREC rank 3920.
//
// Rulings:
//   [2022-09-09] Llanowar Loamspeaker's second ability doesn't untap the land that becomes a
//     creature.

const ANIMATE_TEXT =
  "{T}: Target land you control becomes a 3/3 Elemental creature with haste until end of turn. It's still a land. Activate only as a sorcery.";

export default defineCard({
  name: "Llanowar Loamspeaker",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 1,
  toughness: 3,
  text: `{T}: Add one mana of any color.\n${ANIMATE_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
    {
      cost: { mana: null, tap: true },
      targets: ["land-you-control"],
      // Types added, not set ("it's still a land"), and no colour named, so it
      // keeps its own. It isn't untapped (the ruling).
      effect: {
        kind: "animate",
        target: 0,
        power: 3,
        toughness: 3,
        addTypes: ["creature"],
        addSubtypes: ["Elemental"],
        keywords: ["haste"],
        duration: "end-of-turn",
      },
      resolve: null,
      text: ANIMATE_TEXT,
      sorcerySpeed: true,
    },
  ],
});
