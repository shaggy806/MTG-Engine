import { defineCard } from "../define.js";
import { ROOM_REMINDER } from "../helpers.js";

// The left door of Defiled Crypt // Cadaver Lab (defiled-crypt-cadaver-lab.ts).
const CRYPT =
  "Whenever one or more cards leave your graveyard, create a 2/2 black Horror enchantment creature token. This ability triggers only once each turn.";

export default defineCard({
  name: "Defiled Crypt",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Room"],
  text: `${CRYPT}\n${ROOM_REMINDER}`,
  triggered: [
    {
      trigger: { on: "leaves-graveyard", who: "you" },
      oncePerTurn: true,
      targets: [],
      effect: { kind: "create-token", token: "Horror Token", count: 1 },
      resolve: null,
      text: CRYPT,
    },
  ],
  faces: ["Defiled Crypt // Cadaver Lab", "Defiled Crypt", "Cadaver Lab"],
  split: true,
});
