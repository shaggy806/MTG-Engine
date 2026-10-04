import { defineCard } from "../define.js";

// EDHREC rank 4684.

const LEGENDS = { type: "creature", supertype: "legendary", controlledBy: "you" } as const;

export default defineCard({
  name: "Hajar, Loyal Bodyguard",
  manaCost: "{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 3,
  text: "Sacrifice Hajar: Legendary creatures you control get +1/+0 and gain indestructible until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      // And They Shall Know No Fear's shape.
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt-all", filter: LEGENDS, power: 1, toughness: 0, duration: "end-of-turn" },
          { kind: "grant-keyword-all", filter: LEGENDS, keyword: "indestructible", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: "Sacrifice Hajar: Legendary creatures you control get +1/+0 and gain indestructible until end of turn.",
    },
  ],
});
