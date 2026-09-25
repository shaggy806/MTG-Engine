import { defineCard } from "../define.js";

// The back face of Tergrid, God of Fright.
const DRAIN_TEXT =
  "{T}: Target player loses 3 life unless they sacrifice a nonland permanent of their choice or discard a card.";
const UNTAP_TEXT = "{3}{B}: Untap Tergrid's Lantern.";

export default defineCard({
  name: "Tergrid's Lantern",
  art: "https://cards.scryfall.io/art_crop/back/1/4/14dc88ee-bba9-4625-af0d-89f3762a0ead.jpg",
  manaCost: "{3}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${DRAIN_TEXT}\n${UNTAP_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["player"],
      effect: {
        kind: "unless",
        chooser: 0,
        options: [
          { sacrifice: { notTypes: ["land"] }, text: "Sacrifice a nonland permanent" },
          { discard: 1, text: "Discard a card" },
        ],
        otherwise: { kind: "lose-life", amount: 3, target: 0 },
      },
      resolve: null,
      text: DRAIN_TEXT,
    },
    {
      cost: { mana: "{3}{B}", tap: false },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: UNTAP_TEXT,
    },
  ],
  faces: ["Tergrid, God of Fright", "Tergrid's Lantern"],
});
