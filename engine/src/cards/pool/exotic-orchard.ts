import { defineCard } from "../define.js";

export default defineCard({
  name: "Exotic Orchard",
  types: ["land"],
  text: "{T}: Add one mana of any color that a land an opponent controls could produce.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { producedBy: "opponents-lands" }, amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color that a land an opponent controls could produce.",
    },
  ],
});
