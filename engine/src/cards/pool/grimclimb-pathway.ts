import { defineCard } from "../define.js";

export default defineCard({
  name: "Grimclimb Pathway",
  art: "https://cards.scryfall.io/art_crop/back/d/2/d24c3d51-795d-4c01-a34a-3280fccd2d78.jpg",
  colors: [],
  types: ["land"],
  text: "{T}: Add {B}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: "{T}: Add {B}.",
    },
  ],
  faces: ["Brightclimb Pathway", "Grimclimb Pathway"],
});
