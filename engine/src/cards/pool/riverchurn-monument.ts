import { defineCard } from "../define.js";

const MILL_TEXT = "{1}, {T}: Any number of target players each mill two cards.";
const EXHAUST_TEXT =
  "Exhaust — {2}{U}{U}, {T}: Any number of target players each mill cards equal to the number of cards in their graveyard.";

// Each chosen player mills at once; the exhaust count is each one's own
// graveyard, read as the ability resolves.
export default defineCard({
  name: "Riverchurn Monument",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["artifact"],
  text:
    `${MILL_TEXT} (Each of them puts the top two cards of their library into their graveyard.)\n` +
    `${EXHAUST_TEXT} (Activate each exhaust ability only once.)`,
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [{ kind: "any-number", of: "player" }],
      effect: { kind: "for-each-target", from: 0, effect: { kind: "mill", target: 0, amount: 2 }, simultaneous: true },
      resolve: null,
      text: MILL_TEXT,
    },
    {
      cost: { mana: "{2}{U}{U}", tap: true },
      exhaust: true,
      targets: [{ kind: "any-number", of: "player" }],
      effect: {
        kind: "for-each-target",
        from: 0,
        effect: { kind: "mill", target: 0, amount: { graveyardSize: "each" } },
        simultaneous: true,
      },
      resolve: null,
      text: EXHAUST_TEXT,
    },
  ],
});
