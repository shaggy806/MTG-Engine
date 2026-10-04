import { defineCard } from "../define.js";

// EDHREC rank 5858.
//
// Creeping Tar Pit's shape. Becoming a creature isn't entering, and summoning
// sickness is the land's (the rulings); a second activation's lifelink is
// redundant.

const ANIMATE_TEXT =
  "{1}{W}{B}: Until end of turn, this land becomes a 2/3 white and black Elemental creature with lifelink. It's still a land.";

export default defineCard({
  name: "Shambling Vent",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n{T}: Add {W} or {B}.\n${ANIMATE_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["W", "B"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {W} or {B}.",
    },
    {
      cost: { mana: "{1}{W}{B}", tap: false },
      targets: [],
      effect: {
        kind: "animate",
        target: "source",
        power: 2,
        toughness: 3,
        addTypes: ["creature"],
        addSubtypes: ["Elemental"],
        setColors: ["W", "B"],
        keywords: ["lifelink"],
        duration: "end-of-turn",
      },
      resolve: null,
      text: ANIMATE_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
