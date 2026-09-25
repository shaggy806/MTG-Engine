import { defineCard } from "../define.js";

export default defineCard({
  name: "Hammerhead, Maggia Boss",
  manaCost: "{1}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Rogue", "Villain"],
  power: 2,
  toughness: 1,
  text: "Sacrifice another creature or artifact: Put a +1/+1 counter on Hammerhead.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        sacrifice: { filter: { typesAnyOf: ["creature", "artifact"] } },
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Sacrifice another creature or artifact: Put a +1/+1 counter on Hammerhead.",
      otherOnly: true,
    },
  ],
});
