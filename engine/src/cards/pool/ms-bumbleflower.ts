import { defineCard } from "../define.js";

export default defineCard({
  name: "Ms. Bumbleflower",
  manaCost: "{1}{G}{W}{U}",
  colors: ["G", "W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Rabbit", "Citizen"],
  power: 1,
  toughness: 5,
  keywords: ["vigilance"],
  text:
    "Vigilance\n" +
    "Whenever you cast a spell, target opponent draws a card. Put a +1/+1 counter on target " +
    "creature. It gains flying until end of turn. If this is the second time this ability has " +
    "resolved this turn, you draw two cards.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you" },
      targets: ["opponent", "creature"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1, target: 0 },
          { kind: "add-counter", target: 1, counter: "+1/+1", amount: 1 },
          { kind: "grant-keyword", target: 1, keyword: "flying", duration: "end-of-turn" },
          {
            kind: "conditional",
            condition: { kind: "resolved-this-turn", n: 2 },
            then: { kind: "draw", amount: 2 },
          },
        ],
      },
      resolve: null,
      text:
        "Whenever you cast a spell, target opponent draws a card. Put a +1/+1 counter on target " +
        "creature. It gains flying until end of turn. If this is the second time this ability has " +
        "resolved this turn, you draw two cards.",
    },
  ],
});
