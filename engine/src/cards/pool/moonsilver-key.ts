import { defineCard } from "../define.js";

const TEXT =
  "{1}, {T}, Sacrifice this artifact: Search your library for an artifact card with a mana ability or a basic land card, reveal it, put it into your hand, then shuffle.";

export default defineCard({
  name: "Moonsilver Key",
  manaCost: "{2}",
  types: ["artifact"],
  text: TEXT,
  activated: [
    {
      cost: { mana: "{1}", tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: {
          anyOf: [
            { type: "artifact", hasManaAbility: true },
            { type: "land", supertype: "basic" },
          ],
        },
        destination: "hand",
        reveal: true,
        min: 0,
        max: 1,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
