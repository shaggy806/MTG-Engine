import { defineCard } from "../define.js";

// EDHREC rank 4698.
//
// Rulings:
//   [2023-09-01] If this becomes a creature because of an effect other than its own ability, its
//     last ability will still trigger whenever it attacks.
//   [2023-09-01] If this becomes a creature but you haven't controlled it continuously since your
//     most recent turn began, you won't be able to activate its mana ability or attack with it
//     that turn.
//   [2023-09-01] Counters on Restless Bivouac remain on it when it stops being a creature. If it
//     becomes a creature later, they'll apply to it.

// Restless Cottage's shape. Counters stay on it while it isn't a creature
// and apply again when it is (the ruling) — the engine's counters do.
const ANIMATE_TEXT =
  "{1}{R}{W}: This land becomes a 2/2 red and white Ox creature until end of turn. It's still a land.";
const ATTACK_TEXT = "Whenever this land attacks, put a +1/+1 counter on target creature you control.";

export default defineCard({
  name: "Restless Bivouac",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n{T}: Add {R} or {W}.\n${ANIMATE_TEXT}\n${ATTACK_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "W"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {R} or {W}.",
    },
    {
      cost: { mana: "{1}{R}{W}", tap: false },
      targets: [],
      effect: {
        kind: "animate",
        target: "source",
        power: 2,
        toughness: 2,
        addTypes: ["creature"],
        addSubtypes: ["Ox"],
        setColors: ["R", "W"],
        duration: "end-of-turn",
      },
      resolve: null,
      text: ANIMATE_TEXT,
    },
  ],
  triggered: [
    {
      // Printed on the land, so it triggers however it became a creature (the ruling).
      trigger: { on: "attacks", who: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: ATTACK_TEXT,
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
