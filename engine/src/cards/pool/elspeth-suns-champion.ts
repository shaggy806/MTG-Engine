import { defineCard } from "../define.js";

export default defineCard({
  name: "Elspeth, Sun's Champion",
  manaCost: "{4}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Elspeth"],
  loyalty: 4,
  text:
    "[+1]: Create three 1/1 white Soldier creature tokens.\n" +
    "[-3]: Destroy all creatures with power 4 or greater.\n" +
    "[-7]: You get an emblem with \"Creatures you control get +2/+2 and have flying.\"",
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Soldier Token", count: 3 },
      resolve: null,
      text: "[+1]: Create three 1/1 white Soldier creature tokens.",
    },
    {
      loyaltyCost: -3,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "destroy-all",
        filter: { type: "creature", power: { op: "gte", n: 4 } },
      },
      resolve: null,
      text: "[-3]: Destroy all creatures with power 4 or greater.",
    },
    {
      loyaltyCost: -7,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "create-emblem",
        text: "Creatures you control get +2/+2 and have flying.",
        static: {
          affects: { scope: "creatures-you-control" },
          grantPt: [2, 2],
          grantKeywords: ["flying"],
          text: "Creatures you control get +2/+2 and have flying.",
        },
      },
      resolve: null,
      text: "[-7]: You get an emblem with \"Creatures you control get +2/+2 and have flying.\"",
    },
  ],
});
