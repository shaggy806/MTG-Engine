import { defineCard } from "../define.js";

// #383 in top-commanders.txt.
//
// Looking at the top card any time is for Sigarda's controller alone (rule
// 401.5 — their view only). An Angel or Human spell cast from the top pays
// every cost and keeps its timing; lands stay where they are.
const HEXPROOF_TEXT = "Other permanents you control have hexproof.";
const LOOK_TEXT = "You may look at the top card of your library any time.";
const CAST_TEXT = "You may cast Angel spells and Human spells from the top of your library.";

export default defineCard({
  name: "Sigarda, Font of Blessings",
  manaCost: "{2}{G}{W}",
  colors: ["G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${HEXPROOF_TEXT}\n${LOOK_TEXT}\n${CAST_TEXT}`,
  looksAtOwnLibraryTop: true,
  static: [
    {
      affects: { scope: "filter", filter: { controlledBy: "you" }, excludeSelf: true },
      grantKeywords: ["hexproof"],
      text: HEXPROOF_TEXT,
    },
    {
      affects: { scope: "self" },
      castFromLibraryTop: { filter: { subtypes: ["Angel", "Human"] } },
      text: CAST_TEXT,
    },
  ],
});
