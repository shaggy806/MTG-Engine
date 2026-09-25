import { defineCard } from "../define.js";

export default defineCard({
  name: "Age-Graced Chapel",
  art: "https://cards.scryfall.io/art_crop/back/9/0/90630b20-fc83-475f-bcd5-8bcfee0cf241.jpg",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {W} or {B}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["W", "B"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {W} or {B}.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  faces: ["Glasswing Grace", "Age-Graced Chapel"],
});
