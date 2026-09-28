import { defineCard } from "../define.js";

// The granted warp works as a printed one (rule 702.185): cast from the hand
// for {2}{R}, exiled at the beginning of the next end step, then castable
// from exile on a later turn — that last permission stays with the card
// whether or not Tannuk is still around.
const HASTE_TEXT = "Other creatures you control have haste.";
const WARP_TEXT =
  "Artifact cards and red creature cards in your hand have warp {2}{R}. (You may cast a card from your hand for its warp cost. Exile that permanent at the beginning of the next end step, then you may cast it from exile on a later turn.)";

export default defineCard({
  name: "Tannuk, Steadfast Second",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Kavu", "Pilot"],
  power: 3,
  toughness: 5,
  text: `${HASTE_TEXT}\n${WARP_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantKeywords: ["haste"],
      text: HASTE_TEXT,
    },
    {
      affects: { scope: "self" },
      grantsWarpInHand: {
        cost: "{2}{R}",
        filter: { anyOf: [{ type: "artifact" }, { type: "creature", colors: ["R"] }] },
      },
      text: WARP_TEXT,
    },
  ],
});
