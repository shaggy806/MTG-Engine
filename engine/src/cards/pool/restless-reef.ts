import { defineCard } from "../define.js";

// EDHREC rank 4101.
// Restless Cottage's shape.
//
// Rulings:
//   [2023-11-10] If this becomes a creature because of an effect other than its own ability, its
//     last ability will still trigger whenever it attacks.
//   [2023-11-10] If this becomes a creature but you haven't controlled it continuously since your
//     most recent turn began, you won't be able to activate its mana ability or attack with it
//     that turn.

const ANIMATE_TEXT =
  "{2}{U}{B}: Until end of turn, this land becomes a 4/4 blue and black Shark creature with deathtouch. It's still a land.";
const ATTACK_TEXT = "Whenever this land attacks, target player mills four cards.";

export default defineCard({
  name: "Restless Reef",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n{T}: Add {U} or {B}.\n${ANIMATE_TEXT}\n${ATTACK_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["U", "B"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {U} or {B}.",
    },
    {
      cost: { mana: "{2}{U}{B}", tap: false },
      targets: [],
      effect: {
        kind: "animate",
        target: "source",
        power: 4,
        toughness: 4,
        addTypes: ["creature"],
        addSubtypes: ["Shark"],
        setColors: ["U", "B"],
        keywords: ["deathtouch"],
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
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 4 },
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
