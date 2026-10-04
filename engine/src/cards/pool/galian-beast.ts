import { defineCard } from "../define.js";

// Vincent Valentine's back face.

const DIES_TEXT = "When Galian Beast dies, return it to the battlefield tapped (front face up).";

export default defineCard({
  name: "Galian Beast",
  art: "https://cards.scryfall.io/art_crop/back/0/2/028ef608-acfe-4e9d-90db-eca4411ba78a.jpg",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Werewolf", "Beast"],
  power: 3,
  toughness: 2,
  keywords: ["trample", "lifelink"],
  text: `Trample, lifelink\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      // Ojer Axonil's shape without `transformed`, so the card comes back front
      // face up, under its owner's control.
      effect: { kind: "put-onto-battlefield", target: "source", enterTapped: true },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
  faces: ["Vincent Valentine", "Galian Beast"],
  transform: true,
});
