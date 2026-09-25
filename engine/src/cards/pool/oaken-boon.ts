import { defineCard } from "../define.js";

export default defineCard({
  name: "Oaken Boon",
  art: "https://cards.scryfall.io/art_crop/back/8/b/8bc518fc-904e-4e39-aeda-ffb222bfcc82.jpg",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["sorcery"],
  subtypes: ["Adventure"],
  text: "Put two +1/+1 counters on target creature. (Then exile this card. You may cast the creature later from exile.)",
  targets: ["creature"],
  effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 },
  faces: ["Tuinvale Treefolk", "Oaken Boon"],
  adventure: true,
});
