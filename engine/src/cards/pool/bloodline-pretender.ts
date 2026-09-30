import { defineCard } from "../define.js";

const TEXT = "Whenever another creature you control of the chosen type enters, put a +1/+1 counter on this creature.";

export default defineCard({
  name: "Bloodline Pretender",
  manaCost: "{3}",
  types: ["artifact", "creature"],
  subtypes: ["Shapeshifter"],
  power: 2,
  toughness: 2,
  keywords: ["changeling"],
  text: `Changeling (This card is every creature type.)\nAs this creature enters, choose a creature type.\n${TEXT}`,
  chooseCreatureTypeOnEnter: true,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature", ofChosenType: true },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
