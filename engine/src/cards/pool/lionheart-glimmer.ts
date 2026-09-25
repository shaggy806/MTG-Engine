import { defineCard } from "../define.js";

export default defineCard({
  name: "Lionheart Glimmer",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["enchantment", "creature"],
  subtypes: ["Cat", "Glimmer"],
  power: 2,
  toughness: 5,
  text: "Ward {2} (Whenever this creature becomes the target of a spell or ability an opponent controls, counter it unless that player pays {2}.)\nWhenever you attack, creatures you control get +1/+1 until end of turn.",
  triggered: [
    {
      trigger: { on: "becomes-target", who: "self", byOpponentOnly: true },
      targets: [],
      effect: { kind: "ward", cost: { mana: "{2}" } },
      resolve: null,
      text: "Ward {2}",
    },
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1 },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Whenever you attack, creatures you control get +1/+1 until end of turn.",
    },
  ],
});
