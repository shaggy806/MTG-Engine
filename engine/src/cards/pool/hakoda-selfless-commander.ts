import { defineCard } from "../define.js";

// Looking at the top card any time is for its controller alone (rule 401.5).
// An Ally spell cast from the top pays every cost and keeps its timing (the
// ruling). The sacrifice pumps the creatures you control as it resolves
// (rule 611.2c) — Hakoda itself is gone by then.
const LOOK_TEXT = "You may look at the top card of your library any time.";
const CAST_TEXT = "You may cast Ally spells from the top of your library.";
const SAC_TEXT = "Sacrifice Hakoda: Creatures you control get +0/+5 and gain indestructible until end of turn.";

export default defineCard({
  name: "Hakoda, Selfless Commander",
  manaCost: "{3}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior", "Ally"],
  power: 3,
  toughness: 5,
  keywords: ["vigilance"],
  text: `Vigilance\n${LOOK_TEXT}\n${CAST_TEXT}\n${SAC_TEXT}`,
  looksAtOwnLibraryTop: true,
  static: [
    {
      affects: { scope: "self" },
      castFromLibraryTop: { filter: { subtype: "Ally" } },
      text: CAST_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "modify-pt-all",
            filter: { type: "creature", controlledBy: "you" },
            power: 0,
            toughness: 5,
            duration: "end-of-turn",
          },
          {
            kind: "grant-keyword-all",
            filter: { type: "creature", controlledBy: "you" },
            keyword: "indestructible",
            duration: "end-of-turn",
          },
        ],
      },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});
