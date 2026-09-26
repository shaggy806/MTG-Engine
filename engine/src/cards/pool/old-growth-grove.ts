import { defineCard } from "../define.js";

export default defineCard({
  name: "Old-Growth Grove",
  // A back face has no Scryfall card of its own name — point at its art.
  art: "https://cards.scryfall.io/art_crop/back/0/3/03522b6b-31ec-4126-8885-5dbb2248688b.jpg",
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {B} or {G}.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["B", "G"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {B} or {G}.",
    },
  ],
  faces: ["Revitalizing Repast", "Old-Growth Grove"],
});
