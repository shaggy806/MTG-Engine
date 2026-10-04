import { defineCard } from "../define.js";

// EDHREC rank 4688.
//
// Rulings:
//   [2023-11-10] If this becomes a creature but you haven't controlled it continuously since your
//     most recent turn began, you won't be able to activate its mana ability or attack with it
//     that turn.
//   [2023-11-10] If this becomes a creature because of an effect other than its own ability, its
//     last ability will still trigger whenever it attacks.

// Restless Cottage's shape.
const ANIMATE_TEXT =
  "{2}{R}{G}: This land becomes a 3/4 red and green Dinosaur creature until end of turn. It's still a land.";
const ATTACK_TEXT =
  "Whenever this land attacks, another target attacking creature gets +2/+0 until end of turn. Untap that creature.";

export default defineCard({
  name: "Restless Ridgeline",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n{T}: Add {R} or {G}.\n${ANIMATE_TEXT}\n${ATTACK_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "G"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {R} or {G}.",
    },
    {
      cost: { mana: "{2}{R}{G}", tap: false },
      targets: [],
      effect: {
        kind: "animate",
        target: "source",
        power: 3,
        toughness: 4,
        addTypes: ["creature"],
        addSubtypes: ["Dinosaur"],
        setColors: ["R", "G"],
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
      targets: [{ kind: "other", of: { kind: "permanent", filter: { type: "creature", attacking: true } } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" },
          { kind: "untap", target: 0 },
        ],
      },
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
