import { defineCard } from "../define.js";

// EDHREC rank 6103.

export default defineCard({
  name: "Fateful Absence",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Destroy target creature or planeswalker. Its controller investigates. (They create a Clue token. It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")",
  targets: [{ kind: "permanent", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  // Beast Within's shape: the controller is read as the permanent last
  // existed, so it investigates even once the permanent is gone. Investigate
  // is the creation of a Clue (rule 701.36a — the `investigate` helper).
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      { kind: "create-token", token: "Clue Token", count: 1, who: "target-controller" },
    ],
  },
});
