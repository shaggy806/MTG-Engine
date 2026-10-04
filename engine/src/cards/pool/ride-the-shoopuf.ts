import { defineCard } from "../define.js";

// EDHREC rank 3577.
//
// Rulings:
//   [2025-06-06] Ride the Shoopuf's last ability doesn't have a duration. Once it resolves, it
//     will remain in effect until the game ends, Ride the Shoopuf's leaves the battlefield, or
//     some subsequent effect changes its characteristics, whichever comes first.
//   [2025-06-06] If Ride the Shoopuf becomes a creature but you haven't controlled it continuously
//     since your most recent turn began, you won't be able to attack with it that turn.

const LANDFALL_TEXT = "Landfall — Whenever a land you control enters, put a +1/+1 counter on target creature you control.";
const ANIMATE_TEXT = "{5}{G}{G}: This enchantment becomes a 7/7 Beast creature in addition to its other types.";

export default defineCard({
  name: "Ride the Shoopuf",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${LANDFALL_TEXT}\n${ANIMATE_TEXT}`,
  activated: [
    {
      cost: { mana: "{5}{G}{G}", tap: false },
      targets: [],
      // No duration (the ruling): it stays a 7/7 Beast while it's on the battlefield.
      effect: {
        kind: "animate",
        target: "source",
        power: 7,
        toughness: 7,
        addTypes: ["creature"],
        addSubtypes: ["Beast"],
        duration: "permanent",
      },
      resolve: null,
      text: ANIMATE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: LANDFALL_TEXT,
    },
  ],
});
