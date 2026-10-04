import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 2808.

const PUT_TEXT = "{1}{B}, {T}: Put target creature card from your graveyard on top of your library.";

export default defineCard({
  name: "Volrath's Stronghold",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text: `{T}: Add {C}.\n${PUT_TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{1}{B}", tap: true },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "put-on-library", target: 0, position: "top" },
      resolve: null,
      text: PUT_TEXT,
    },
  ],
});
