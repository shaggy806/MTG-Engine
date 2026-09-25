import { defineCard } from "../define.js";

// #286 in top-commanders.txt.
//
// X is fixed as the ability resolves (rule 611.2b) and the reduction lasts
// the turn for black and/or red spells you cast.
const TEXT =
  "{T}: Spells you cast this turn that are black and/or red cost {X} less to cast, where X is the " +
  "amount of life you lost this turn. Activate only as a sorcery.";

export default defineCard({
  name: "Rowan, Scion of War",
  manaCost: "{1}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 4,
  toughness: 2,
  keywords: ["menace"],
  text: `Menace\n${TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      sorcerySpeed: true,
      targets: [],
      effect: {
        kind: "player-effect",
        duration: "end-of-turn",
        reduceSpells: {
          applies: { anyOf: [{ colors: ["B"] }, { colors: ["R"] }] },
          reduceGeneric: { turnStat: "life-lost", who: "you" },
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
