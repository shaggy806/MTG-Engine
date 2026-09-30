import { defineCard } from "../define.js";

const TEXT =
  "Whenever another creature you control enters, that creature gets +2/+0 and gains haste until end of turn. (It can attack and {T} this turn.)";

export default defineCard({
  name: "Ogre Battledriver",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Ogre", "Warrior"],
  power: 3,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", otherOnly: true, filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt", target: "trigger-object", power: 2, toughness: 0, duration: "end-of-turn" },
          { kind: "grant-keyword", target: "trigger-object", keyword: "haste", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
