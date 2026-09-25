import { defineCard } from "../define.js";

// #257 in top-commanders.txt.
//
// - The upkeep sacrifice is an `unless` you answer yourself: without a land
//   to sacrifice you aren't asked, and The Gitrog Monster goes.
// - The draw trigger is batched: once per simultaneous move of one or more
//   land cards into your graveyard, from anywhere.
const UPKEEP_TEXT = "At the beginning of your upkeep, sacrifice The Gitrog Monster unless you sacrifice a land.";
const LAND_TEXT = "You may play an additional land on each of your turns.";
const DRAW_TEXT = "Whenever one or more land cards are put into your graveyard from anywhere, draw a card.";

export default defineCard({
  name: "The Gitrog Monster",
  manaCost: "{3}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Frog", "Horror"],
  power: 6,
  toughness: 6,
  keywords: ["deathtouch"],
  text: `Deathtouch\n${UPKEEP_TEXT}\n${LAND_TEXT}\n${DRAW_TEXT}`,
  static: [{ affects: { scope: "self" }, extraLandsPerTurn: 1, text: LAND_TEXT }],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "unless",
        chooser: "you",
        options: [{ sacrifice: { type: "land" }, text: "Sacrifice a land" }],
        otherwise: { kind: "sacrifice-source" },
      },
      resolve: null,
      text: UPKEEP_TEXT,
    },
    {
      trigger: { on: "put-into-graveyard", who: "you", filter: { type: "land" }, batched: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
