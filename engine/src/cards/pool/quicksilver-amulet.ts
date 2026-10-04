import { defineCard } from "../define.js";

// EDHREC rank 4063.
//
// Rulings:
//   [2004-10-04] Any 'X' in the creature's cost is treated as zero.
//   [2007-05-01] Putting the card onto the battlefield is optional. When the ability resolves, you
//     can choose not to.
//   [2011-09-22] You don't pay any costs of that creature card, including additional costs.

export default defineCard({
  name: "Quicksilver Amulet",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "{4}, {T}: You may put a creature card from your hand onto the battlefield.",
  activated: [
    {
      cost: { mana: "{4}", tap: true },
      targets: [],
      // Elvish Piper's shape: optional (min 0), no costs of the creature paid.
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "creature" },
      },
      resolve: null,
      text: "{4}, {T}: You may put a creature card from your hand onto the battlefield.",
    },
  ],
});
