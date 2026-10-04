import type { EffectSpec, SearchZones } from "../../effects.js";
import { defineCard } from "../define.js";

// EDHREC rank 4549.

// "Your library and/or graveyard" is Finale of Devastation's shape: a
// resolution-time `modal` over the three `search-library` `zones`, where only
// a search that includes the library shuffles.
const TEXT =
  "When this creature enters, search your library and/or graveyard for a card named Command Tower, reveal it, and put it into your hand. If you search your library this way, shuffle.";

const search = (zones: SearchZones): EffectSpec => ({
  kind: "search-library",
  filter: { name: "Command Tower" },
  destination: "hand",
  reveal: true,
  min: 0,
  max: 1,
  zones,
});

export default defineCard({
  name: "Tower Winder",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Snake"],
  power: 1,
  toughness: 1,
  keywords: ["reach", "deathtouch"],
  text: `Reach, deathtouch\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "modal",
        minModes: 1,
        maxModes: 1,
        modes: [
          { text: "Search your library and graveyard", effect: search("library-and-graveyard") },
          { text: "Search your library", effect: search("library") },
          { text: "Search your graveyard", effect: search("graveyard") },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
