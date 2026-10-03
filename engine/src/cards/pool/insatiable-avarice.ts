import { defineCard } from "../define.js";

// Spree (rule 702.172a). The tutor shuffles, then puts the card found on top
// (`library-top`, as Vampiric Tutor), so a draw from the second mode — which
// resolves after it — draws it. "A card" is a quantity, not a quality, so the
// search must find one while the library has any (rule 701.23d).
export default defineCard({
  name: "Insatiable Avarice",
  manaCost: "{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Spree (Choose one or more additional costs.)\n" +
    "+ {2} — Search your library for a card, then shuffle and put that card on top.\n" +
    "+ {B}{B} — Target player draws three cards and loses 3 life.",
  castModal: {
    minModes: 1,
    maxModes: 2,
    modes: [
      {
        text: "+ {2} — Search your library for a card, then shuffle and put that card on top.",
        spreeCost: "{2}",
        effect: { kind: "search-library", filter: {}, destination: "library-top", min: 1, max: 1 },
      },
      {
        text: "+ {B}{B} — Target player draws three cards and loses 3 life.",
        spreeCost: "{B}{B}",
        targets: ["player"],
        effect: {
          kind: "sequence",
          effects: [
            { kind: "draw", amount: 3, target: 0 },
            { kind: "lose-life", amount: 3, target: 0 },
          ],
        },
      },
    ],
  },
});
