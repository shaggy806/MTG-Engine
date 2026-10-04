import { defineCard } from "../define.js";

// EDHREC rank 3437.
//
// "An Aura card and/or an Equipment card": one find per slot (Krosan Verge's
// `together.oneEach`), either of which may be missed (rule 701.19b).

const SEARCH_TEXT =
  "{1}{R}{R}{W}, {T}, Sacrifice this land: Search your library for an Aura card and/or an Equipment card, reveal them, put them into your hand, then shuffle.";

export default defineCard({
  name: "Axgard Armory",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n{T}: Add {W}.\n${SEARCH_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "W", amount: 1 },
      resolve: null,
      text: "{T}: Add {W}.",
    },
    {
      cost: { mana: "{1}{R}{R}{W}", tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtypes: ["Aura", "Equipment"] },
        destination: "hand",
        min: 0,
        max: 2,
        reveal: true,
        together: {
          oneEach: [
            { label: "an Aura card", filter: { subtype: "Aura" } },
            { label: "an Equipment card", filter: { subtype: "Equipment" } },
          ],
        },
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
