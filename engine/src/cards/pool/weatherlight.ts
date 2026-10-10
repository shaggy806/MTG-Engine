import { defineCard } from "../define.js";
import { crew } from "../helpers.js";

// EDHREC rank 2483. Historic: an artifact, a legendary or a Saga.
const LOOK =
  "Whenever Weatherlight deals combat damage to a player, look at the top five cards of your library. You may reveal a historic card from among them and put it into your hand. Put the rest on the bottom of your library in a random order. (Artifacts, legendaries, and Sagas are historic.)";

export default defineCard({
  name: "Weatherlight",
  manaCost: "{4}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Vehicle"],
  power: 4,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${LOOK}\nCrew 3`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 5,
        reveal: "chosen",
        min: 0,
        max: 1,
        filter: { anyOf: [{ type: "artifact" }, { supertype: "legendary" }, { subtype: "Saga" }] },
        destination: "hand",
        leftover: "bottom-random",
      },
      resolve: null,
      text: LOOK,
    },
  ],
  activated: [crew(3)],
});
