import { defineCard } from "../define.js";

// EDHREC rank 5952. "A Spider Hero card" is one with both subtypes: `subtype`
// and `subtypes` are each required, so together they ask for Spider and Hero.

const TEXT =
  "Fateful Bite — {2}, Sacrifice this creature: Search your library for a Spider Hero card, reveal it, put it into your hand, then shuffle. Activate only as a sorcery.";

export default defineCard({
  name: "Radioactive Spider",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spider"],
  power: 1,
  toughness: 1,
  keywords: ["reach", "deathtouch"],
  text: `Reach, deathtouch\n${TEXT}`,
  activated: [
    {
      cost: { mana: "{2}", tap: false, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtype: "Spider", subtypes: ["Hero"] },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: TEXT,
      sorcerySpeed: true,
    },
  ],
});
