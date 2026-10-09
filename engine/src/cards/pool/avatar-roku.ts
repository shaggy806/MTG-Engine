import { defineCard } from "../define.js";
import { firebending } from "../helpers.js";

// The back face of The Legend of Roku. Its token is "Dragon Token (Avatar
// Roku)".
const FIREBENDING_TEXT =
  "Firebending 4 (Whenever this creature attacks, add {R}{R}{R}{R}. This mana lasts until end of combat.)";
const DRAGON_TEXT = "{8}: Create a 4/4 red Dragon creature token with flying and firebending 4.";

export default defineCard({
  name: "Avatar Roku",
  art: "https://cards.scryfall.io/art_crop/back/9/5/95f2f5af-d405-4534-8683-5a9001f997b4.jpg",
  colors: [],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Avatar"],
  power: 4,
  toughness: 4,
  text: `${FIREBENDING_TEXT}\n${DRAGON_TEXT}`,
  triggered: [firebending(4, FIREBENDING_TEXT)],
  activated: [
    {
      cost: { mana: "{8}", tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Dragon Token (Avatar Roku)", count: 1 },
      resolve: null,
      text: DRAGON_TEXT,
    },
  ],
  faces: ["The Legend of Roku", "Avatar Roku"],
  transform: true,
});
