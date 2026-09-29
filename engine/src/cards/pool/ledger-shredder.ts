import { defineCard } from "../define.js";

const TEXT =
  "Whenever a player casts their second spell each turn, this creature connives. (Draw a card, then discard a " +
  "card. If you discarded a nonland card, put a +1/+1 counter on this creature.)";

export default defineCard({
  name: "Ledger Shredder",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird", "Advisor"],
  power: 1,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "any", nthEachTurn: 2 },
      targets: [],
      effect: { kind: "connive", target: "source" },
      resolve: null,
      text: TEXT,
    },
  ],
});
