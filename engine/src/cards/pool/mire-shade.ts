import { defineCard } from "../define.js";

export default defineCard({
  name: "Mire Shade",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Shade"],
  power: 1,
  toughness: 1,
  text: "{B}, Sacrifice a Swamp: Put a +1/+1 counter on this creature. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{B}", tap: false, sacrifice: { filter: { subtype: "Swamp" } } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{B}, Sacrifice a Swamp: Put a +1/+1 counter on this creature. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
