import { defineCard } from "../define.js";

export default defineCard({
  name: "Ride the Rails",
  art: "https://cards.scryfall.io/art_crop/back/5/b/5b2a02f3-3921-4f40-9ffa-70bc08b052e1.jpg",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "Target creature gets +2/+1 until end of turn. (Then exile this card. You may cast the creature later from exile.)",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: 2, toughness: 1, duration: "end-of-turn" },
  faces: ["Minecart Daredevil", "Ride the Rails"],
  adventure: true,
});
