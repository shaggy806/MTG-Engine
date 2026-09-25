import { defineCard } from "../define.js";

export default defineCard({
  name: "Thornling",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elemental", "Shapeshifter"],
  power: 4,
  toughness: 4,
  text: "{G}: This creature gains haste until end of turn.\n{G}: This creature gains trample until end of turn.\n{G}: This creature gains indestructible until end of turn.\n{1}: This creature gets +1/-1 until end of turn.\n{1}: This creature gets -1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{G}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "haste", duration: "end-of-turn" },
      resolve: null,
      text: "{G}: This creature gains haste until end of turn.",
    },
    {
      cost: { mana: "{G}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "trample", duration: "end-of-turn" },
      resolve: null,
      text: "{G}: This creature gains trample until end of turn.",
    },
    {
      cost: { mana: "{G}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "indestructible",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{G}: This creature gains indestructible until end of turn.",
    },
    {
      cost: { mana: "{1}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "{1}: This creature gets +1/-1 until end of turn.",
    },
    {
      cost: { mana: "{1}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: -1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{1}: This creature gets -1/+1 until end of turn.",
    },
  ],
});
