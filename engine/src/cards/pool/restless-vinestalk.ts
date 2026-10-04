import { defineCard } from "../define.js";

// EDHREC rank 5818.
//
// Rulings:
//   [2023-09-01] If this becomes a creature but you haven't controlled it continuously since your
//     most recent turn began, you won't be able to activate its mana ability or attack with it
//     that turn.
//   [2023-09-01] If this becomes a creature because of an effect other than its own ability, its
//     last ability will still trigger whenever it attacks.

// Restless Ridgeline's shape; the attack trigger sets a base P/T with Azure
// Beastbinder's `animate` that adds no types (layer 7b, so pumps and counters
// still apply over it).
const ANIMATE_TEXT =
  "{3}{G}{U}: Until end of turn, this land becomes a 5/5 green and blue Plant creature with trample. It's still a land.";
const ATTACK_TEXT =
  "Whenever this land attacks, up to one other target creature has base power and toughness 3/3 until end of turn.";

export default defineCard({
  name: "Restless Vinestalk",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n{T}: Add {G} or {U}.\n${ANIMATE_TEXT}\n${ATTACK_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["G", "U"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {G} or {U}.",
    },
    {
      cost: { mana: "{3}{G}{U}", tap: false },
      targets: [],
      effect: {
        kind: "animate",
        target: "source",
        power: 5,
        toughness: 5,
        addTypes: ["creature"],
        addSubtypes: ["Plant"],
        setColors: ["G", "U"],
        keywords: ["trample"],
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
      targets: [{ kind: "optional", of: { kind: "other", of: "creature" } }],
      effect: {
        kind: "animate",
        target: 0,
        power: 3,
        toughness: 3,
        addTypes: [],
        addSubtypes: [],
        duration: "end-of-turn",
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
