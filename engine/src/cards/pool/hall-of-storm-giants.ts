import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC rank 5613.
//
// The entry check is Lair of the Hydra's: the land entering isn't on the
// battlefield yet as the replacement looks, so "two or more other lands" is
// `controls … atLeast: 2` (a land entering alongside isn't counted — the
// ruling). Ward rides on the land's own modifiers until end of turn, as Den of
// the Bugbear's granted trigger does: activating twice grants two instances,
// each triggering separately, and one gained in response to a targeting
// doesn't trigger for it (the rulings).
//
// Rulings:
//   [2021-07-23] If you turn Hall of Storm Giants into a creature but haven't controlled it
//     continuously since your most recent turn began, you won't be able to activate its mana
//     ability or attack with it.
//   [2021-07-23] If you activate Hall of Storm Giants's last ability multiple times, it gains
//     multiple instances of ward {3}. Each of those instances will trigger separately and ask the
//     opponent who controls the spell or ability to pay {3}. If they don't for any of those
//     instances, the spell or ability will be countered.
//   [2021-07-23] If an opponent casts a spell or ability that targets Hall of Storm Giants, and
//     you activate the last ability in response, the ward ability Hall of Storm Giants gains won't
//     trigger. (However, if it already had ward at the moment it became the target of the spell or
//     ability, that instance of ward would trigger.)
//   [2021-07-23] If Hall of Storm Giants enters the battlefield at the same time as one or more
//     other lands, it doesn't take those lands into consideration when determining how many other
//     lands you control.

const ENTRY_TEXT = "If you control two or more other lands, this land enters tapped.";
const ANIMATE_TEXT =
  "{5}{U}: Until end of turn, this land becomes a 7/7 blue Giant creature with ward {3}. It's still a land.";

export default defineCard({
  name: "Hall of Storm Giants",
  colors: [],
  types: ["land"],
  text:
    `${ENTRY_TEXT}\n{T}: Add {U}.\n${ANIMATE_TEXT} ` +
    "(Whenever it becomes the target of a spell or ability an opponent controls, counter it unless that player pays {3}.)",
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
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "{T}: Add {U}.",
    },
    {
      cost: { mana: "{5}{U}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "animate",
            target: "source",
            power: 7,
            toughness: 7,
            addTypes: ["creature"],
            addSubtypes: ["Giant"],
            setColors: ["U"],
            duration: "end-of-turn",
          },
          { kind: "grant-triggered", target: "source", duration: "end-of-turn", ability: ward({ mana: "{3}" }) },
        ],
      },
      resolve: null,
      text: ANIMATE_TEXT,
    },
  ],
});
