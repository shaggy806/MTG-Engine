import { defineCard } from "../define.js";

const GRAVEYARD_TEXT =
  "As long as this card is in your graveyard and you control an Island, creatures you control have flying.";

// The static works only from its owner's graveyard (`fromGraveyard`), for
// the creatures that player controls; on the battlefield Wonder has flying
// of its own and grants nothing.
export default defineCard({
  name: "Wonder",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Incarnation"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${GRAVEYARD_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control" },
      fromGraveyard: true,
      condition: { kind: "controls", filter: { subtype: "Island" }, atLeast: 1 },
      grantKeywords: ["flying"],
      text: GRAVEYARD_TEXT,
    },
  ],
});
