import { defineCard } from "../define.js";

// EDHREC rank 4825.

export default defineCard({
  name: "Stonehoof Chieftain",
  manaCost: "{7}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Centaur", "Warrior"],
  power: 8,
  toughness: 8,
  keywords: ["trample", "indestructible"],
  text: "Trample, indestructible\nWhenever another creature you control attacks, it gains trample and indestructible until end of turn.",
  triggered: [
    {
      trigger: { on: "attacks", who: "you-control", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: "trigger-object", keyword: "trample", duration: "end-of-turn" },
          { kind: "grant-keyword", target: "trigger-object", keyword: "indestructible", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: "Whenever another creature you control attacks, it gains trample and indestructible until end of turn.",
    },
  ],
});
