import { defineCard } from "../define.js";

// "Becomes tapped" (rule 701.21a) fires however Kilo is tapped: attacking,
// paying another permanent's "tap an untapped creature you control" cost
// (the player picks which creature pays it), or convoking.
export default defineCard({
  name: "Kilo, Apogee Mind",
  manaCost: "{U}{R}{W}",
  colors: ["U", "R", "W"],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Robot", "Artificer"],
  power: 3,
  toughness: 3,
  keywords: ["haste"],
  text: "Haste\nWhenever Kilo becomes tapped, proliferate.",
  triggered: [
    {
      trigger: { on: "becomes-tapped", who: "self" },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: "Whenever Kilo becomes tapped, proliferate.",
    },
  ],
});
