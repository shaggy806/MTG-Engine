import { defineCard } from "../define.js";

// #313 in top-commanders.txt.
const ENTER_TEXT = "When The Master of Keys enters, put X +1/+1 counters on it and mill twice X cards.";
const ESCAPE_TEXT =
  "Each enchantment card in your graveyard has escape. The escape cost is equal to the card's mana " +
  "cost plus exile three other cards from your graveyard. (You may cast cards from your graveyard " +
  "for their escape cost.)";

export default defineCard({
  name: "The Master of Keys",
  manaCost: "{X}{W}{U}{B}",
  colors: ["W", "U", "B"],
  supertypes: ["legendary"],
  types: ["enchantment", "creature"],
  subtypes: ["Horror"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${ENTER_TEXT}\n${ESCAPE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: "x" },
          { kind: "mill", target: "you", amount: { product: ["x", 2] } },
        ],
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      grantsToGraveyard: { filter: { type: "enchantment" }, escape: { cost: "mana-cost", exileCount: 3 } },
      text: ESCAPE_TEXT,
    },
  ],
});
