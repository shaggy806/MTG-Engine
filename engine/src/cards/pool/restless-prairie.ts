import { defineCard } from "../define.js";

// EDHREC rank 5140.
//
// Rulings:
//   [2023-11-10] If this becomes a creature but you haven't controlled it continuously since your
//     most recent turn began, you won't be able to activate its mana ability or attack with it
//     that turn.
//   [2023-11-10] If this becomes a creature because of an effect other than its own ability, its
//     last ability will still trigger whenever it attacks.

// Restless Bivouac's shape.
const ANIMATE_TEXT =
  "{2}{G}{W}: This land becomes a 3/3 green and white Llama creature until end of turn. It's still a land.";
const ATTACK_TEXT = "Whenever this land attacks, other creatures you control get +1/+1 until end of turn.";

export default defineCard({
  name: "Restless Prairie",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n{T}: Add {G} or {W}.\n${ANIMATE_TEXT}\n${ATTACK_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["G", "W"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {G} or {W}.",
    },
    {
      cost: { mana: "{2}{G}{W}", tap: false },
      targets: [],
      effect: {
        kind: "animate",
        target: "source",
        power: 3,
        toughness: 3,
        addTypes: ["creature"],
        addSubtypes: ["Llama"],
        setColors: ["G", "W"],
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
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
        exceptSource: true,
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
