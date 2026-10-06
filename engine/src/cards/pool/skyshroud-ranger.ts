import { defineCard } from "../define.js";

// EDHREC rank 6464.
//
// Rulings:
//   [2007-05-01] Putting the card onto the battlefield is optional. When the ability resolves, you
//     can choose not to.
//
// Not playing a land: it doesn't use a land drop (Arboreal Grazer's shape).
const TEXT = "{T}: You may put a land card from your hand onto the battlefield. Activate only as a sorcery.";

export default defineCard({
  name: "Skyshroud Ranger",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Ranger"],
  power: 1,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      sorcerySpeed: true,
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "land" },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
