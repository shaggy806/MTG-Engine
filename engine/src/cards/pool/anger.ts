import { defineCard } from "../define.js";

const GRAVEYARD_TEXT =
  "As long as this card is in your graveyard and you control a Mountain, creatures you control have haste.";

// The static works only from its owner's graveyard (`fromGraveyard`), for
// the creatures that player controls, its timestamp the one it got going
// there (the ruling); on the battlefield Anger has haste of its own.
export default defineCard({
  name: "Anger",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Incarnation"],
  power: 2,
  toughness: 2,
  keywords: ["haste"],
  text: `Haste\n${GRAVEYARD_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control" },
      fromGraveyard: true,
      condition: { kind: "controls", filter: { subtype: "Mountain" }, atLeast: 1 },
      grantKeywords: ["haste"],
      text: GRAVEYARD_TEXT,
    },
  ],
});
