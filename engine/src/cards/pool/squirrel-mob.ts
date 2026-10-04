import { defineCard } from "../define.js";

// EDHREC rank 5432.
//
// Rulings:
//   [2021-06-18] Because damage remains marked on a creature until the cleanup step or an effect
//     removes that damage, nonlethal damage dealt to Squirrel Mob may become lethal if the number
//     of other Squirrels on the battlefield decreases.

export default defineCard({
  name: "Squirrel Mob",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Squirrel"],
  power: 2,
  toughness: 2,
  text: "This creature gets +1/+1 for each other Squirrel on the battlefield.",
  static: [
    {
      affects: { scope: "self" },
      grantPtPerCount: { filter: { subtype: "Squirrel" }, pt: [1, 1], excludeSelf: true },
      text: "This creature gets +1/+1 for each other Squirrel on the battlefield.",
    },
  ],
});
