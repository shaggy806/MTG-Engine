import { defineCard } from "../define.js";

// #282 in top-commanders.txt.
//
// "That player" is the player whose end step it is; the count is read as the
// trigger resolves, over creatures they control now that didn't attack this
// turn (a creature that changed zones is a new object that didn't).
const HASTE_TEXT = "All creatures have haste.";
const END_TEXT =
  "At the beginning of each player's end step, Kratos deals damage to that player equal to the number " +
  "of creatures that player controls that didn't attack this turn.";

export default defineCard({
  name: "Kratos, God of War",
  manaCost: "{R}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["God", "Warrior"],
  power: 2,
  toughness: 3,
  keywords: ["double-strike"],
  text: `Double strike\n${HASTE_TEXT}\n${END_TEXT}`,
  static: [{ affects: { scope: "all-creatures" }, grantKeywords: ["haste"], text: HASTE_TEXT }],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      targets: [],
      effect: {
        kind: "damage",
        who: "active-player",
        amount: { countOf: { type: "creature", controlledBy: "active-player", attackedThisTurn: false } },
      },
      resolve: null,
      text: END_TEXT,
    },
  ],
});
