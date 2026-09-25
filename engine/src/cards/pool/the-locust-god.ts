import { defineCard } from "../define.js";

// #436 in top-commanders.txt.
//
// The delayed return finds the card only if it's still the one that died,
// in its owner's graveyard (rule 400.7).
const INSECT_TEXT = "Whenever you draw a card, create a 1/1 blue and red Insect creature token with flying and haste.";
const LOOT_TEXT = "{2}{U}{R}: Draw a card, then discard a card.";
const DIES_TEXT = "When The Locust God dies, return it to its owner's hand at the beginning of the next end step.";

export default defineCard({
  name: "The Locust God",
  manaCost: "{4}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["God"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${INSECT_TEXT}\n${LOOT_TEXT}\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "draws", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Insect Token (Flying, Haste)", count: 1 },
      resolve: null,
      text: INSECT_TEXT,
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "delayed-trigger",
        at: "next-end-step",
        effect: { kind: "return-to-hand", target: "source", from: "graveyard" },
        text: "Return The Locust God to its owner's hand.",
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}{U}{R}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "discard", target: "you", amount: 1 },
        ],
      },
      resolve: null,
      text: LOOT_TEXT,
    },
  ],
});
