import { defineCard } from "../define.js";

export default defineCard({
  name: "Ant-Man, Scott Lang",
  manaCost: "{1}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Hero"],
  power: 2,
  toughness: 2,
  text: "{4}: Put a +1/+1 counter on Ant-Man.",
  activated: [
    {
      cost: { mana: "{4}", tap: false },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{4}: Put a +1/+1 counter on Ant-Man.",
    },
  ],
});
