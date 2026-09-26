import { defineCard } from "../define.js";

const TEXT =
  "Lieutenant — At the beginning of combat on your turn, if you control your commander, create a 1/1 " +
  "colorless Thopter artifact creature token with flying. That token gains haste until end of turn.";

// Loyal Guardian's Lieutenant shape: an intervening-if (rule 603.4), so it
// needs a commander on your side both as combat begins and as it resolves —
// either of two Partners will do (the rulings).
export default defineCard({
  name: "Loyal Apprentice",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 2,
  toughness: 1,
  keywords: ["haste"],
  text: `Haste\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      condition: { kind: "controls", filter: { isCommander: true, controlledBy: "you" }, atLeast: 1 },
      targets: [],
      effect: { kind: "create-token", token: "Thopter Token", count: 1, gainUntilEndOfTurn: ["haste"] },
      resolve: null,
      text: TEXT,
    },
  ],
});
