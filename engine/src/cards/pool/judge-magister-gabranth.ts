import { defineCard } from "../define.js";

export default defineCard({
  name: "Judge Magister Gabranth",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Advisor", "Knight"],
  power: 2,
  toughness: 2,
  keywords: ["menace"],
  text: "Menace (This creature can't be blocked except by two or more creatures.)\nWhenever another creature or artifact you control dies, put a +1/+1 counter on Judge Magister Gabranth.",
  triggered: [
    {
      trigger: {
        on: "dies",
        who: "you-control",
        filter: { typesAnyOf: ["creature", "artifact"] },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever another creature or artifact you control dies, put a +1/+1 counter on Judge Magister Gabranth.",
    },
  ],
});
