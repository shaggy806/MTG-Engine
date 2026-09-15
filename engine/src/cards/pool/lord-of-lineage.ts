import { defineCard } from "../define.js";

/** The back face of Bloodline Keeper. */
export default defineCard({
  name: "Lord of Lineage",
  // A back face has no Scryfall card of its own name — point at its art.
  art: "https://cards.scryfall.io/art_crop/back/6/0/60658907-dd63-478d-a66a-123e4e9d2a00.jpg",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Other Vampire creatures you control get +2/+2.\n" +
    "{T}: Create a 2/2 black Vampire creature token with flying.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Vampire" },
      grantPt: [2, 2],
      text: "Other Vampire creatures you control get +2/+2.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Vampire Token", count: 1 },
      resolve: null,
      text: "{T}: Create a 2/2 black Vampire creature token with flying.",
    },
  ],
  faces: ["Bloodline Keeper", "Lord of Lineage"],
  transform: true,
});
