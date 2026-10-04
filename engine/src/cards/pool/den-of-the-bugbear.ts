import { defineCard } from "../define.js";

// EDHREC rank 3064.
// Makes Goblin → uses "Goblin Token".
//
// The entry check is Lair of the Hydra's: the land entering isn't on the
// battlefield yet as the replacement looks, so "two or more other lands" is
// `controls … atLeast: 2` (a land entering alongside isn't counted — the
// ruling). The granted attack trigger rides on the land's own modifiers until
// end of turn; activating twice grants it twice, and each instance makes a
// Goblin (the ruling).
const ENTRY_TEXT = "If you control two or more other lands, this land enters tapped.";
const ATTACK_TEXT = "Whenever this creature attacks, create a 1/1 red Goblin creature token that's tapped and attacking.";
const ANIMATE_TEXT =
  "{3}{R}: Until end of turn, this land becomes a 3/2 red Goblin creature with \"Whenever this creature attacks, create a 1/1 red Goblin creature token that's tapped and attacking.\" It's still a land.";

export default defineCard({
  name: "Den of the Bugbear",
  colors: [],
  types: ["land"],
  text: `${ENTRY_TEXT}\n{T}: Add {R}.\n${ANIMATE_TEXT}`,
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
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{T}: Add {R}.",
    },
    {
      cost: { mana: "{3}{R}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "animate",
            target: "source",
            power: 3,
            toughness: 2,
            addTypes: ["creature"],
            addSubtypes: ["Goblin"],
            setColors: ["R"],
            duration: "end-of-turn",
          },
          {
            kind: "grant-triggered",
            target: "source",
            duration: "end-of-turn",
            ability: {
              trigger: { on: "attacks", who: "self" },
              targets: [],
              effect: { kind: "create-token", token: "Goblin Token", count: 1, tapped: true, attacking: "choose" },
              resolve: null,
              text: ATTACK_TEXT,
            },
          },
        ],
      },
      resolve: null,
      text: ANIMATE_TEXT,
    },
  ],
});
