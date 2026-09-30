import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const TOKEN_TEXT = "{1}{R}, {T}: Create a 0/1 red Kobold creature token named Kobolds of Kher Keep.";

// Prossh's token: the Kobolds card's own definition, minted as a token.
export default defineCard({
  name: "Kher Keep",
  supertypes: ["legendary"],
  types: ["land"],
  text: `{T}: Add {C}.\n${TOKEN_TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{1}{R}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Kobolds of Kher Keep", count: 1 },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
});
