import { defineCard } from "../define.js";

export default defineCard({
  name: "Yahenni, Undying Partisan",
  manaCost: "{2}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Aetherborn", "Vampire"],
  power: 2,
  toughness: 2,
  keywords: ["haste"],
  text: "Haste\nWhenever a creature an opponent controls dies, put a +1/+1 counter on Yahenni.\nSacrifice another creature: Yahenni gains indestructible until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "indestructible",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Sacrifice another creature: Yahenni gains indestructible until end of turn.",
      otherOnly: true,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature", controlledBy: "opponent" } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever a creature an opponent controls dies, put a +1/+1 counter on Yahenni.",
    },
  ],
});
