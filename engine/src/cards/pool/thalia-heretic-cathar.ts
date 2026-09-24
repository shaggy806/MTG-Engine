import { defineCard } from "../define.js";

// An `others-enter-battlefield` replacement over an `anyOf` filter. A land
// that "enters tapped unless …" enters tapped even when its condition holds,
// and a shock land isn't offered its life (the ruling); nothing entering at
// the same time as Thalia is affected.
const TEXT = "Creatures and nonbasic lands your opponents control enter tapped.";

export default defineCard({
  name: "Thalia, Heretic Cathar",
  manaCost: "{2}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 2,
  keywords: ["first-strike"],
  text: `First strike\n${TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "others-enter-battlefield",
        filter: {
          controlledBy: "opponent",
          anyOf: [{ type: "creature" }, { type: "land", notSupertype: "basic" }],
        },
        tapped: true,
      },
      text: TEXT,
    },
  ],
});
