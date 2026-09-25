import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// #460 in top-commanders.txt.
const TEXT = "Creatures your opponents control have base toughness 1.";
const WARD = ward({ discard: 1 });

export default defineCard({
  name: "Maha, Its Feathers Night",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental", "Bird"],
  power: 6,
  toughness: 5,
  keywords: ["flying", "trample"],
  text: `Flying, trample\n${WARD.text}\n${TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "opponent" } },
      setBasePt: { toughness: 1 },
      text: TEXT,
    },
  ],
  triggered: [WARD],
});
