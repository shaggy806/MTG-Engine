import { defineCard } from "../define.js";

// Its power and toughness are a characteristic-defining ability, read in
// every zone (rule 604.3 — the ruling). The cast trigger resolves before the
// spell, even if that's countered. Each opponent in turn order reveals until
// a land card and puts every card revealed, the land too, into their
// graveyard — the whole library when there's no land in it (the ruling).
const PT_TEXT =
  "Consuming Aberration's power and toughness are each equal to the number of cards in your opponents' graveyards.";
const CAST_TEXT =
  "Whenever you cast a spell, each opponent reveals cards from the top of their library until they reveal a land card, then puts those cards into their graveyard.";

export default defineCard({
  name: "Consuming Aberration",
  manaCost: "{3}{U}{B}",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Horror"],
  power: 0,
  toughness: 0,
  text: `${PT_TEXT}\n${CAST_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: { countOf: { countInGraveyard: { ownedBy: "opponent" } }, plusPower: 0, plusToughness: 0 },
      text: PT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you" },
      targets: [],
      effect: {
        kind: "for-each-player",
        who: "each-opponent",
        effect: { kind: "reveal-until", whose: "that-player", filter: { type: "land" }, rest: "graveyard" },
      },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
