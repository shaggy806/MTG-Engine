import { defineCard } from "../define.js";

// EDHREC rank 5142. "Its controller" is the exiled creature's, as it last
// existed on the battlefield (rule 608.2h).
const TEXT =
  "Exile target creature, then roll a d20.\n1—9 | Its controller creates a 4/4 green Ox creature token.\n10—19 | Its controller creates a 2/2 green Boar creature token.\n20 | Its controller creates a 0/1 white Goat creature token.";

export default defineCard({
  name: "Contraband Livestock",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: TEXT,
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "exile", target: 0 },
      {
        kind: "roll-dice",
        sides: 20,
        table: [
          { min: 1, max: 9, effect: { kind: "create-token", token: "4/4 Green Ox Token", count: 1, who: "target-controller" } },
          { min: 10, max: 19, effect: { kind: "create-token", token: "Boar Token", count: 1, who: "target-controller" } },
          { min: 20, effect: { kind: "create-token", token: "Goat Token", count: 1, who: "target-controller" } },
        ],
      },
    ],
  },
});
