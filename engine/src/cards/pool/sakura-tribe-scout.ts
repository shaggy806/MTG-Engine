import { defineCard } from "../define.js";

// EDHREC rank 3648.
//
// Walking Atlas's ability: a pick from the hand (`look-and-choose`,
// `zone: "hand"`), not a land play.
const TEXT = "{T}: You may put a land card from your hand onto the battlefield.";

export default defineCard({
  name: "Sakura-Tribe Scout",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Snake", "Shaman", "Scout"],
  power: 1,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
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
