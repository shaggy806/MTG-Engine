import { defineCard } from "../define.js";

const TEXT = "{T}: Draw two cards. Target opponent gains control of this creature. Activate only during your turn.";

// "Your turn" is the activating player's: whoever controls it now, so the
// opponent who got it can pass it on during their own turn.
export default defineCard({
  name: "Humble Defector",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 2,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      condition: { kind: "your-turn" },
      targets: ["opponent"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 2 },
          { kind: "gain-control", target: "source", untilEndOfTurn: false, who: { target: 0 } },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
