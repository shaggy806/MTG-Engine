import { defineCard } from "../define.js";

// EDHREC rank 5582.
//
// Rulings:
//   [2016-09-20] After the creature returns to the battlefield, it will be a new object with no
//     connection to the creature that was exiled. It won't be in combat or have any additional
//     abilities it may have had before it was exiled. Any +1/+1 counters on it or Auras attached
//     to it are removed, and any Equipment will no longer be attached.
//   [2016-09-20] If a creature token is exiled this way, it will cease to exist and won't return
//     to the battlefield.
// Blur's Oracle text and shape.

export default defineCard({
  name: "Acrobatic Maneuver",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Exile target creature you control, then return that card to the battlefield under its owner's control.\nDraw a card.",
  targets: ["creature-you-control"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "flicker", target: 0 },
      { kind: "draw", amount: 1 },
    ],
  },
});
