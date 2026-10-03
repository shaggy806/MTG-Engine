import { defineCard } from "../define.js";

// The legendary creature has to be there already as the land enters: one
// entering with it doesn't count (its ruling). The three cards the Treasures
// cost are picked as the ability goes on the stack.
const TAPPED_TEXT = "Mines of Moria enters tapped unless you control a legendary creature.";
const TREASURE_TEXT = "{3}{R}, {T}, Exile three cards from your graveyard: Create two Treasure tokens.";

export default defineCard({
  name: "Mines of Moria",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text: `${TAPPED_TEXT}\n{T}: Add {R}.\n${TREASURE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        tappedUnless: { kind: "controls", filter: { type: "creature", supertype: "legendary" }, atLeast: 1 },
      },
      text: TAPPED_TEXT,
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
      cost: { mana: "{3}{R}", tap: true, exileFromGraveyard: { count: 3 } },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 2 },
      resolve: null,
      text: TREASURE_TEXT,
    },
  ],
});
