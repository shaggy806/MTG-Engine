import { defineCard } from "../define.js";

// EDHREC rank 3041.
//
// Becoming a creature isn't entering (no enters triggers), and summoning
// sickness is the land's: it can't attack unless it began your turn under
// your control (the rulings). "It can't be blocked this turn" lasts exactly as
// long as the animation, so it rides on the animate as `unblockable`.
const ANIMATE_TEXT =
  "{1}{U}{B}: Until end of turn, this land becomes a 3/2 blue and black Elemental creature. It's still a land. It can't be blocked this turn.";

export default defineCard({
  name: "Creeping Tar Pit",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n{T}: Add {U} or {B}.\n${ANIMATE_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["U", "B"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {U} or {B}.",
    },
    {
      cost: { mana: "{1}{U}{B}", tap: false },
      targets: [],
      effect: {
        kind: "animate",
        target: "source",
        power: 3,
        toughness: 2,
        addTypes: ["creature"],
        addSubtypes: ["Elemental"],
        setColors: ["U", "B"],
        keywords: ["unblockable"],
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
