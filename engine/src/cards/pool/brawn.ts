import { defineCard } from "../define.js";

const GRAVEYARD_TEXT =
  "As long as this card is in your graveyard and you control a Forest, creatures you control have trample.";

// The static works only from its owner's graveyard (`fromGraveyard`).
export default defineCard({
  name: "Brawn",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Incarnation"],
  power: 3,
  toughness: 3,
  keywords: ["trample"],
  text: `Trample\n${GRAVEYARD_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control" },
      fromGraveyard: true,
      condition: { kind: "controls", filter: { subtype: "Forest" }, atLeast: 1 },
      grantKeywords: ["trample"],
      text: GRAVEYARD_TEXT,
    },
  ],
});
