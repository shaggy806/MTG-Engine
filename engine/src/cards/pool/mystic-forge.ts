import { defineCard } from "../define.js";

// Looking at the top card any time is for its controller alone (rule 401.5).
// Only spells come off the top — an artifact land is played, never cast (the
// ruling) — paying every cost and keeping their timing. The exile is plain
// exile, with no permission to play the card.
const LOOK_TEXT = "You may look at the top card of your library any time.";
const CAST_TEXT = "You may cast artifact spells and colorless spells from the top of your library.";
const EXILE_TEXT = "{T}, Pay 1 life: Exile the top card of your library.";

export default defineCard({
  name: "Mystic Forge",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: `${LOOK_TEXT}\n${CAST_TEXT}\n${EXILE_TEXT}`,
  looksAtOwnLibraryTop: true,
  static: [
    {
      affects: { scope: "self" },
      castFromLibraryTop: { filter: { anyOf: [{ type: "artifact" }, { colorless: true }] } },
      text: CAST_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true, payLife: 1 },
      targets: [],
      effect: { kind: "exile-from-library", amount: 1 },
      resolve: null,
      text: EXILE_TEXT,
    },
  ],
});
