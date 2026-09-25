import { defineCard } from "../define.js";

export default defineCard({
  name: "Desperate Parry",
  art: "https://cards.scryfall.io/art_crop/back/0/0/0001e77a-7fff-49d2-a55c-42f6fdf6db08.jpg",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "Target creature gets -4/-0 until end of turn. (Then exile this card. You may cast the creature later from exile.)",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: -4, toughness: 0, duration: "end-of-turn" },
  faces: ["Obyra's Attendants", "Desperate Parry"],
  adventure: true,
});
