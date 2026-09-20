import { defineCard } from "../define.js";
import { entersTappedStatic } from "../helpers.js";

export default defineCard({
  name: "Path of Ancestry",
  types: ["land"],
  text:
    "Path of Ancestry enters tapped.\n" +
    "{T}: Add one mana of any color in your commander's color identity. When that mana is spent " +
    "to cast a creature spell that shares a creature type with your commander, scry 1.",
  static: [entersTappedStatic("Path of Ancestry")],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        // "In your commander's color identity" is modelled as plain
        // any-colour, exactly as Arcane Signet and Commander's Sphere are:
        // for any deck that passes `validateCommanderDeck`, every card this
        // mana could be spent on is already inside that identity, so the two
        // readings can't diverge. See AUTHORING §15.
        mana: "any-color",
        amount: 1,
        whenSpent: {
          spell: "shares-type-with-commander",
          effect: { kind: "scry", amount: 1 },
          text:
            "When that mana is spent to cast a creature spell that shares a creature type with " +
            "your commander, scry 1.",
        },
      },
      resolve: null,
      text:
        "{T}: Add one mana of any color in your commander's color identity. When that mana is " +
        "spent to cast a creature spell that shares a creature type with your commander, scry 1.",
    },
  ],
});
