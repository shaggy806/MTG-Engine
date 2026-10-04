import { defineCard } from "../define.js";

// EDHREC rank 2507.
//
// The entry check is the fast lands' shape with the threshold moved: the land
// entering isn't on the battlefield yet as the replacement looks, so
// "two or more other lands" is `controls … atLeast: 2`. X is announced with
// the activation, at least 1 (`minX`), and the creature's size is read once
// as the ability resolves (rule 608.2h).
//
// Rulings:
//   [2021-07-23] If Lair of the Hydra enters the battlefield at the same time as one or more other
//     lands, it doesn't take those lands into consideration when determining how many other lands
//     you control.
//   [2021-07-23] If you turn Lair of the Hydra into a creature but haven't controlled it
//     continuously since your most recent turn began, you won't be able to activate its mana
//     ability or attack with it.

const ENTRY_TEXT = "If you control two or more other lands, this land enters tapped.";
const ANIMATE_TEXT =
  "{X}{G}: Until end of turn, this land becomes an X/X green Hydra creature. It's still a land. X can't be 0.";

export default defineCard({
  name: "Lair of the Hydra",
  colors: [],
  types: ["land"],
  text: `${ENTRY_TEXT}\n{T}: Add {G}.\n${ANIMATE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        tappedUnless: { kind: "not", of: { kind: "controls", filter: { type: "land" }, atLeast: 2 } },
      },
      text: ENTRY_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{T}: Add {G}.",
    },
    {
      cost: { mana: "{X}{G}", tap: false },
      targets: [],
      effect: {
        kind: "animate",
        target: "source",
        power: "x",
        toughness: "x",
        addTypes: ["creature"],
        addSubtypes: ["Hydra"],
        setColors: ["G"],
        duration: "end-of-turn",
      },
      resolve: null,
      text: ANIMATE_TEXT,
      minX: 1,
    },
  ],
});
