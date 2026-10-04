import { defineCard } from "../define.js";

// The back face of Legion's Landing.
export default defineCard({
  name: "Adanto, the First Fort",
  art: "https://cards.scryfall.io/art_crop/back/0/5/05e2a5e6-3aaa-4096-bdd0-fcc1afe5a36c.jpg",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text: "(Transforms from Legion's Landing.)\n{T}: Add {W}.\n{2}{W}, {T}: Create a 1/1 white Vampire creature token with lifelink.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "W", amount: 1 },
      resolve: null,
      text: "{T}: Add {W}.",
    },
    {
      cost: { mana: "{2}{W}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Lifelink Vampire Token", count: 1 },
      resolve: null,
      text: "{2}{W}, {T}: Create a 1/1 white Vampire creature token with lifelink.",
    },
  ],
  faces: ["Legion's Landing", "Adanto, the First Fort"],
  transform: true,
});
