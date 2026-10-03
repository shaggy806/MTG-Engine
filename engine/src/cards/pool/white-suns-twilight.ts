import { defineCard } from "../define.js";

const TEXT =
  "You gain X life. Create X 1/1 colorless Phyrexian Mite artifact creature tokens with toxic 1 and " +
  '"This token can\'t block." If X is 5 or more, destroy all other creatures. (Players dealt combat damage ' +
  "by a creature with toxic 1 also get a poison counter.)";

// Martial Coup's shape: "other" is every creature but the Mites just made
// (`notThisWay`), so they're made as their own objects rather than joining a
// stack of older Mites, which would spare those too.
export default defineCard({
  name: "White Sun's Twilight",
  manaCost: "{X}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: TEXT,
  effect: {
    kind: "sequence",
    effects: [
      { kind: "gain-life", amount: "x" },
      { kind: "create-token", token: "Phyrexian Mite Token", count: "x", separate: true },
      {
        kind: "conditional",
        condition: { kind: "x", compare: { op: "gte", n: 5 } },
        then: { kind: "destroy-all", filter: { type: "creature", notThisWay: "created" } },
      },
    ],
  },
});
