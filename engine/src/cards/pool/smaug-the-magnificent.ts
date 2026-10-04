import { defineCard } from "../define.js";

// EDHREC rank 4141.
// Makes Treasure → uses "Treasure Token".
// The Treasures are counted as the attack trigger resolves.

const ATTACK_TEXT =
  "Whenever Smaug attacks, he deals damage equal to the number of Treasures you control to any target.";
const UPKEEP_TEXT = "At the beginning of your upkeep, create a Treasure token.";

export default defineCard({
  name: "Smaug the Magnificent",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 3,
  keywords: ["flying", "haste"],
  text: `Flying, haste\n${ATTACK_TEXT}\n${UPKEEP_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["any-target"],
      effect: { kind: "damage", target: 0, amount: { countOf: { subtype: "Treasure", controlledBy: "you" } } },
      resolve: null,
      text: ATTACK_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
