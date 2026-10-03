import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const ANY_TEXT =
  "{1}, {T}: Add one mana of any color. When you spend this mana to cast your commander, scry X, where X is " +
  "the number of times it's been cast from the command zone this game.";

// "Your commander" is a commander you own (rule 903.3). The rider fires as a
// triggered ability above the spell (slot 0), by which time this cast is
// counted (rule 903.8's count, `commanderCastsOf`).
export default defineCard({
  name: "Study Hall",
  types: ["land"],
  text: `{T}: Add {C}.\n${ANY_TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 1,
        whenSpent: {
          spell: { isCommander: true, ownedBy: "you" },
          effect: { kind: "scry", amount: { commanderCastsOf: 0 } },
          text:
            "When you spend this mana to cast your commander, scry X, where X is the number of times it's been " +
            "cast from the command zone this game.",
        },
      },
      resolve: null,
      text: ANY_TEXT,
    },
  ],
});
