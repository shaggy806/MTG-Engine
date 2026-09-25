import { defineCard } from "../define.js";

export default defineCard({
  name: "Savage Knuckleblade",
  manaCost: "{G}{U}{R}",
  colors: ["U", "R", "G"],
  types: ["creature"],
  subtypes: ["Ogre", "Warrior"],
  power: 4,
  toughness: 4,
  text: "{2}{G}: This creature gets +2/+2 until end of turn. Activate only once each turn.\n{2}{U}: Return this creature to its owner's hand.\n{R}: This creature gains haste until end of turn.",
  activated: [
    {
      cost: { mana: "{2}{G}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{2}{G}: This creature gets +2/+2 until end of turn. Activate only once each turn.",
      oncePerTurn: true,
    },
    {
      cost: { mana: "{2}{U}", tap: false },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: "{2}{U}: Return this creature to its owner's hand.",
    },
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "haste", duration: "end-of-turn" },
      resolve: null,
      text: "{R}: This creature gains haste until end of turn.",
    },
  ],
});
