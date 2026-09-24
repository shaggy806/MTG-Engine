import { defineCard } from "../define.js";

// Rule 111.10f: the predefined Clue — what investigate (rule 701.36a)
// creates. The sacrifice is a cost, so it's gone before the draw resolves,
// and there's no {T}: a Clue can be cracked the turn it's made, and several
// at once. Its activated ability is also what keeps it out of token stacks
// (`Game.isStackableTokenName`) — each Clue is its own object.
export default defineCard({
  name: "Clue Token",
  types: ["artifact"],
  subtypes: ["Clue"],
  text: "{2}, Sacrifice this token: Draw a card.",
  activated: [
    {
      cost: { mana: "{2}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}, Sacrifice this token: Draw a card.",
    },
  ],
});
