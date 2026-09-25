import { defineCard } from "../define.js";

export default defineCard({
  name: "Jenara, Asura of War",
  manaCost: "{G}{W}{U}",
  colors: ["W", "U", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\n{1}{W}: Put a +1/+1 counter on Jenara.",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{1}{W}: Put a +1/+1 counter on Jenara.",
    },
  ],
});
