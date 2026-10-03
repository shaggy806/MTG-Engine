import { defineCard } from "../define.js";

const GRAVEYARD_TEXT =
  "As long as this card is in your graveyard and you control a Swamp, creatures you control have swampwalk.";

// The static works only from its owner's graveyard (`fromGraveyard`).
export default defineCard({
  name: "Filth",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Incarnation"],
  power: 2,
  toughness: 2,
  keywords: ["swampwalk"],
  text: `Swampwalk (This creature can't be blocked as long as defending player controls a Swamp.)\n${GRAVEYARD_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control" },
      fromGraveyard: true,
      condition: { kind: "controls", filter: { subtype: "Swamp" }, atLeast: 1 },
      grantKeywords: ["swampwalk"],
      text: GRAVEYARD_TEXT,
    },
  ],
});
