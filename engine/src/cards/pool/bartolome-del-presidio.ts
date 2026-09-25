import { defineCard } from "../define.js";

export default defineCard({
  name: "Bartolomé del Presidio",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Knight"],
  power: 2,
  toughness: 1,
  text: "Sacrifice another creature or artifact: Put a +1/+1 counter on Bartolomé del Presidio.",
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
      text: "Sacrifice another creature or artifact: Put a +1/+1 counter on Bartolomé del Presidio.",
      otherOnly: true,
    },
  ],
});
