import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const GRANT =
  "{2}{W}{B}, {T}: Creatures you control gain deathtouch and lifelink until end of turn.";

// `grant-keyword-all` stamps a modifier on each creature matching as the
// ability resolves — so, per the 2011-01-22 ruling, a creature that comes
// under your control later in the turn doesn't get either keyword.
export default defineCard({
  name: "Vault of the Archangel",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${GRANT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{2}{W}{B}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "grant-keyword-all",
            filter: { type: "creature", controlledBy: "you" },
            keyword: "deathtouch",
            duration: "end-of-turn",
          },
          {
            kind: "grant-keyword-all",
            filter: { type: "creature", controlledBy: "you" },
            keyword: "lifelink",
            duration: "end-of-turn",
          },
        ],
      },
      resolve: null,
      text: GRANT,
    },
  ],
});
