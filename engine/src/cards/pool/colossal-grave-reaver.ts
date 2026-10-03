import { defineCard } from "../define.js";

// The three cards milled go to the graveyard at once, so however many
// creature cards are among them the last ability triggers once (the ruling)
// and puts one of them — your choice, if there's more than one still there —
// onto the battlefield. It sees any move of creature cards from your library
// to your graveyard, not only its own mill.
const MILL_TEXT = "Whenever this creature enters or attacks, mill three cards.";
const RETURN_TEXT =
  "Whenever one or more creature cards are put into your graveyard from your library, put one of them onto the battlefield.";

export default defineCard({
  name: "Colossal Grave-Reaver",
  manaCost: "{6}{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 7,
  toughness: 6,
  keywords: ["flying"],
  text: `Flying\n${MILL_TEXT}\n${RETURN_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 3 },
      resolve: null,
      text: MILL_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 3 },
      resolve: null,
      text: MILL_TEXT,
    },
    {
      trigger: { on: "put-into-graveyard", who: "you", filter: { type: "creature" }, from: "library", batched: true },
      targets: [],
      effect: { kind: "put-arrived-onto-battlefield", count: 1 },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
