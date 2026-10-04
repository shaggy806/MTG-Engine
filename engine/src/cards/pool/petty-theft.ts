import { defineCard } from "../define.js";

export default defineCard({
  name: "Petty Theft",
  art: "https://cards.scryfall.io/art_crop/back/2/5/25d309d6-9e56-441e-bd29-5c903d5221bf.jpg",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "Return target nonland permanent an opponent controls to its owner's hand.",
  targets: ["nonland-permanent-an-opponent-controls"],
  effect: { kind: "return-to-hand", target: 0 },
  faces: ["Brazen Borrower", "Petty Theft"],
  adventure: true,
});
