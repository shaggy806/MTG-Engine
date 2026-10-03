import { defineCard } from "../define.js";

// Looking at the top card any time is for its controller alone (rule 401.5).
// A creature spell is judged by its power as the spell it would be (rule
// 601.3e), cast at its normal timing — a creature with flash any time it
// could be (the ruling) — and the one cast this way gains haste until end of
// turn, which the permanent it becomes keeps (rule 400.7a).
const LOOK_TEXT = "You may look at the top card of your library any time.";
const CAST_TEXT =
  "You may cast creature spells with power 4 or greater from the top of your library. If you cast a creature spell this way, it gains haste until end of turn.";

export default defineCard({
  name: "Thundermane Dragon",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${LOOK_TEXT}\n${CAST_TEXT}`,
  looksAtOwnLibraryTop: true,
  static: [
    {
      affects: { scope: "self" },
      castFromLibraryTop: {
        filter: { type: "creature", power: { op: "gte", n: 4 } },
        gainsHaste: true,
      },
      text: CAST_TEXT,
    },
  ],
});
