import { defineCard } from "../define.js";

/** The back face of The Emperor of Palamecia. */
export default defineCard({
  name: "The Lord Master of Hell",
  art: "https://cards.scryfall.io/art_crop/back/3/d/3d75e8fd-6139-4b10-9ce3-195b47d72e0c.jpg",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Demon", "Noble", "Wizard"],
  power: 3,
  toughness: 3,
  text:
    "Starfall — Whenever The Lord Master of Hell attacks, it deals X damage to each opponent, " +
    "where X is the number of noncreature, nonland cards in your graveyard.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "damage",
        who: "each-opponent",
        amount: { countInGraveyard: { notTypes: ["creature", "land"], ownedBy: "you" } },
      },
      resolve: null,
      text:
        "Starfall — Whenever The Lord Master of Hell attacks, it deals X damage to each opponent, " +
        "where X is the number of noncreature, nonland cards in your graveyard.",
    },
  ],
  faces: ["The Emperor of Palamecia", "The Lord Master of Hell"],
  transform: true,
});
