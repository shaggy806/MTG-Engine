import { defineCard } from "../define.js";

// EDHREC rank 5116.
// Makes Sand Warrior → use "Sand Warrior Token".
//
// Rulings:
//   [2024-04-12] Sand Scout must be on the battlefield for its last ability to trigger. If it is
//     put into your graveyard at the same time as one or more land cards you own, its ability
//     won’t trigger.

const ENTER_TEXT =
  "When this creature enters, if an opponent controls more lands than you, search your library for a Desert card, put it onto the battlefield tapped, then shuffle.";
const LAND_TEXT =
  "Whenever one or more land cards are put into your graveyard from anywhere, create a 1/1 red, green, and white Sand Warrior creature token. This ability triggers only once each turn.";

export default defineCard({
  name: "Sand Scout",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Scout"],
  power: 2,
  toughness: 2,
  text: `${ENTER_TEXT}\n${LAND_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      // Intervening-if (rule 603.4) — Knight of the White Orchid's shape.
      condition: { kind: "opponent-controls-more", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtype: "Desert" },
        destination: "battlefield",
        min: 0,
        max: 1,
        enterTapped: true,
      },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      // Crawling Sensation's shape.
      trigger: { on: "put-into-graveyard", who: "you", filter: { type: "land" }, batched: true },
      oncePerTurn: true,
      targets: [],
      effect: { kind: "create-token", token: "Sand Warrior Token", count: 1 },
      resolve: null,
      text: LAND_TEXT,
    },
  ],
});
