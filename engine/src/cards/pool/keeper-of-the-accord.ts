import { defineCard } from "../define.js";

const SOLDIER_TEXT =
  "At the beginning of each opponent's end step, if that player controls more creatures than you, create a 1/1 white Soldier creature token.";
const PLAINS_TEXT =
  "At the beginning of each opponent's end step, if that player controls more lands than you, you may search your library for a basic Plains card, put it onto the battlefield tapped, then shuffle.";

// Intervening "if"s: checked as the end step begins and again on resolution
// (the ruling), each against the player whose end step it is.
export default defineCard({
  name: "Keeper of the Accord",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 4,
  text: `${SOLDIER_TEXT}\n${PLAINS_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "opponent" },
      condition: { kind: "opponent-controls-more", filter: { type: "creature" }, activePlayerOnly: true },
      targets: [],
      effect: { kind: "create-token", token: "Soldier Token", count: 1 },
      resolve: null,
      text: SOLDIER_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "end", who: "opponent" },
      condition: { kind: "opponent-controls-more", filter: { type: "land" }, activePlayerOnly: true },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for a basic Plains card?",
        effect: {
          kind: "search-library",
          filter: { supertype: "basic", type: "land", subtype: "Plains" },
          destination: "battlefield",
          enterTapped: true,
          min: 0,
          max: 1,
        },
      },
      resolve: null,
      text: PLAINS_TEXT,
    },
  ],
});
