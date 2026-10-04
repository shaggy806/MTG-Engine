import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 2927.
const PUT_TEXT = "{B}, {T}: Put target Zombie card from your graveyard on top of your library.";

export default defineCard({
  name: "Unholy Grotto",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${PUT_TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{B}", tap: true },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { subtype: "Zombie" } }],
      effect: { kind: "put-on-library", target: 0, position: "top" },
      resolve: null,
      text: PUT_TEXT,
    },
  ],
});
