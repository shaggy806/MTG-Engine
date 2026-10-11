import { defineCard } from "../define.js";

const ANTHEM_TEXT = "Other Assassins you control get +2/+0.";

// Disguise {B}{R} (rule 702.168): cast face down for {3} as a 2/2 with ward
// {2}, turned face up for {B}{R}.
export default defineCard({
  name: "Arno Dorian",
  manaCost: "{2}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Assassin"],
  power: 3,
  toughness: 3,
  keywords: ["deathtouch"],
  text: `Deathtouch\n${ANTHEM_TEXT}\nDisguise {B}{R}`,
  morph: { keyword: "disguise", cost: "{B}{R}" },
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", subtype: "Assassin", controlledBy: "you" }, excludeSelf: true },
      grantPt: [2, 0],
      text: ANTHEM_TEXT,
    },
  ],
});
