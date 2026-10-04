import { defineCard } from "../define.js";

// EDHREC rank 4699.
//
// Rulings:
//   [2023-09-01] If this becomes a creature but you haven't controlled it continuously since your
//     most recent turn began, you won't be able to activate its mana ability or attack with it
//     that turn.
//   [2023-09-01] If this becomes a creature because of an effect other than its own ability, its
//     last ability will still trigger whenever it attacks.

// Restless Cottage's shape. "Defending player" is the player the attack
// trigger names (`"trigger-player"`, Nemesis of Reason's shape).
const ANIMATE_TEXT =
  "{2}{W}{B}: This land becomes a 1/4 white and black Nightmare creature until end of turn. It's still a land.";
const ATTACK_TEXT = "Whenever this land attacks, defending player loses 2 life and you gain 2 life.";

export default defineCard({
  name: "Restless Fortress",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n{T}: Add {W} or {B}.\n${ANIMATE_TEXT}\n${ATTACK_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["W", "B"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {W} or {B}.",
    },
    {
      cost: { mana: "{2}{W}{B}", tap: false },
      targets: [],
      effect: {
        kind: "animate",
        target: "source",
        power: 1,
        toughness: 4,
        addTypes: ["creature"],
        addSubtypes: ["Nightmare"],
        setColors: ["W", "B"],
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
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", who: "trigger-player", amount: 2 },
          { kind: "gain-life", amount: 2 },
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
