import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const MANA_TEXT = "{T}: Add one mana of any color. Spend this mana only to cast a Dragon spell or an Omen spell.";
const SEARCH_TEXT =
  "{4}, {T}, Sacrifice this land: Search your library for a Dragon card, reveal it, put it into your hand, then shuffle.";

export default defineCard({
  name: "Maelstrom of the Spirit Dragon",
  types: ["land"],
  text: `{T}: Add {C}.\n${MANA_TEXT}\n${SEARCH_TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 1,
        spendOnly: {
          spell: { anyOf: [{ subtype: "Dragon" }, { subtype: "Omen" }] },
          text: "Spend this mana only to cast a Dragon spell or an Omen spell.",
        },
      },
      resolve: null,
      text: MANA_TEXT,
    },
    {
      cost: { mana: "{4}", tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtype: "Dragon" },
        destination: "hand",
        reveal: true,
        min: 0,
        max: 1,
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
  ],
});
