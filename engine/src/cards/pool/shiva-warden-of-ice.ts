import { defineCard } from "../define.js";

// The back face of Jill, Shiva's Dominant: a Saga creature. Chapter III's
// return is Bahamut, Warden of Light's: a flicker of the source, which comes
// back front face up as Jill — a new object that's no Saga, so nothing
// sacrifices it.
const MESMERIZE_TEXT = "I, II — Mesmerize — Target creature can't be blocked this turn.";
const COLD_SNAP_TEXT =
  "III — Cold Snap — Tap all lands your opponents control. Exile Shiva, then return it to the battlefield (front face up).";

export default defineCard({
  name: "Shiva, Warden of Ice",
  art: "https://cards.scryfall.io/art_crop/back/1/f/1f163763-4802-4a96-a5bc-f3c381db7b5c.jpg",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["enchantment", "creature"],
  subtypes: ["Saga", "Elemental"],
  power: 4,
  toughness: 5,
  text: `(As this Saga enters and after your draw step, add a lore counter.)\n${MESMERIZE_TEXT}\n${COLD_SNAP_TEXT}`,
  chapters: [
    {
      at: [1, 2],
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "unblockable", duration: "end-of-turn" },
      resolve: null,
      text: MESMERIZE_TEXT,
    },
    {
      at: [3],
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "tap-all", filter: { type: "land", controlledBy: "opponent" } },
          { kind: "flicker", target: "source" },
        ],
      },
      resolve: null,
      text: COLD_SNAP_TEXT,
    },
  ],
  faces: ["Jill, Shiva's Dominant", "Shiva, Warden of Ice"],
  transform: true,
});
