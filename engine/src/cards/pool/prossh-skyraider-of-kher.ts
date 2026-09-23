import { defineCard } from "../define.js";

export default defineCard({
  name: "Prossh, Skyraider of Kher",
  manaCost: "{3}{B}{R}{G}",
  colors: ["B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text:
    "When you cast this spell, create X 0/1 red Kobold creature tokens named Kobolds of Kher " +
    "Keep, where X is the amount of mana spent to cast it.\n" +
    "Flying\n" +
    "Sacrifice another creature: Prossh gets +1/+0 until end of turn.",
  triggered: [
    {
      // A cast trigger, so it resolves before Prossh does, and a Prossh put
      // onto the battlefield without being cast makes nothing. The mana
      // spent includes commander tax (2020-11-10 ruling).
      trigger: { on: "this-cast" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Kobolds of Kher Keep",
        count: { manaSpentOf: "source" },
      },
      resolve: null,
      text:
        "When you cast this spell, create X 0/1 red Kobold creature tokens named Kobolds of Kher " +
        "Keep, where X is the amount of mana spent to cast it.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      otherOnly: true,
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice another creature: Prossh gets +1/+0 until end of turn.",
    },
  ],
});
