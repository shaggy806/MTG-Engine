import { defineCard } from "../define.js";

// EDHREC rank 3805.
//
// Both abilities are `attacks-player` triggers, which fire once per player
// attacked. The first targets a creature the attacked player (`trigger-player`)
// controls; the second's attacking player is the active player.

const GOAD_TEXT = "Whenever you attack a player, tap target creature that player controls and goad it.";
const DRAW_TEXT =
  "Whenever an opponent attacks another one of your opponents, you and the attacking player each draw a card and lose 1 life.";

export default defineCard({
  name: "Karazikar, the Eye Tyrant",
  manaCost: "{3}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Beholder"],
  power: 5,
  toughness: 5,
  text: `${GOAD_TEXT} (Until your next turn, that creature attacks each combat if able and attacks a player other than you if able.)\n${DRAW_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks-player", who: "you", defender: "opponent" },
      targets: [{ kind: "permanent", whose: "trigger-player", filter: { type: "creature" } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "tap", target: 0 },
          { kind: "goad", target: 0 },
        ],
      },
      resolve: null,
      text: GOAD_TEXT,
    },
    {
      trigger: { on: "attacks-player", who: "opponent", defender: "opponent" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "draw", amount: 1, who: "active-player" },
          { kind: "lose-life", amount: 1 },
          { kind: "lose-life", amount: 1, who: "active-player" },
        ],
      },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
