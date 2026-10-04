import { defineCard } from "../define.js";

// The Adventure half of Hypnotic Sprite (Alter Fate's face shape); the
// counter is Mental Misstep's mana-value-filtered spell target.
export default defineCard({
  name: "Mesmeric Glare",
  art: "https://cards.scryfall.io/art_crop/back/7/a/7acbd812-b994-4e68-8f95-04222796e994.jpg",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "Counter target spell with mana value 3 or less. (Then exile this card. You may cast the creature later from exile.)",
  targets: [{ kind: "spell", filter: { manaValue: { op: "lte", n: 3 } } }],
  effect: { kind: "counter", target: 0 },
  faces: ["Hypnotic Sprite", "Mesmeric Glare"],
  adventure: true,
});
