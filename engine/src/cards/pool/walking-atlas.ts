import { defineCard } from "../define.js";

// EDHREC rank 3012.
//
// Rulings:
//   [2010-03-01] The word "artifact" was inadvertently omitted from Walking Atlas's type line. The
//     card has received errata to correct this omission; it is an artifact creature.
//   [2010-03-01] Putting a land onto the battlefield as a result of Walking Atlas's ability isn't
//     the same as playing a land. You may do put a land onto the battlefield even if it's an
//     opponent's turn or you've played a land this turn. Similarly, putting a land onto the
//     battlefield during your turn doesn't preclude you from playing a land later in that turn.
//
// Terrain Generator's hand pick (`look-and-choose`, `zone: "hand"`): not a land play.
const TEXT = "{T}: You may put a land card from your hand onto the battlefield.";

export default defineCard({
  name: "Walking Atlas",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
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
