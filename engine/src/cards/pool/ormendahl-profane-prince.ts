import { defineCard } from "../define.js";

// The back face of Westvale Abbey.
export default defineCard({
  name: "Ormendahl, Profane Prince",
  art: "https://cards.scryfall.io/art_crop/back/5/f/5fbc6091-a161-45b0-9932-543b569caaee.jpg",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 9,
  toughness: 7,
  keywords: ["flying", "lifelink", "indestructible", "haste"],
  text: "Flying, lifelink, indestructible, haste",
  faces: ["Westvale Abbey", "Ormendahl, Profane Prince"],
  transform: true,
});
