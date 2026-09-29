import { defineCard } from "../define.js";

const TEXT = "Create X 1/1 white Soldier creature tokens. If X is 5 or more, destroy all other creatures.";

// "Other" is every creature but the Soldiers just made (`notThisWay`), so
// they're made as their own objects: joining a stack of older Soldiers would
// spare those too. X is the X chosen, not the mana spent (the ruling).
export default defineCard({
  name: "Martial Coup",
  manaCost: "{X}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: TEXT,
  effect: {
    kind: "sequence",
    effects: [
      { kind: "create-token", token: "Soldier Token", count: "x", separate: true },
      {
        kind: "conditional",
        condition: { kind: "x", compare: { op: "gte", n: 5 } },
        then: { kind: "destroy-all", filter: { type: "creature", notThisWay: "created" } },
      },
    ],
  },
});
