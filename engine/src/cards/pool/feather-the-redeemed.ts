import { defineCard } from "../define.js";

// Top-commanders rank 166. The rulings this follows: the spell may target
// other things as well as a creature you control; the replacement and the
// end-step return both hold even if Feather leaves after the trigger; only a
// spell that resolves is exiled (one countered or fizzling goes to the
// graveyard), and only a card you own that would go to your graveyard (not a
// copy, a spell you don't own, or one whose own text moves it); with another
// replacement that would exile it (flashback, an Adventure), you choose which
// applies first, and only Feather's brings it back (rule 616.1).
const RETURN_TEXT =
  "Whenever you cast an instant or sorcery spell that targets a creature you control, exile that card " +
  "instead of putting it into your graveyard as it resolves. If you do, return it to your hand at the " +
  "beginning of the next end step.";

export default defineCard({
  name: "Feather, the Redeemed",
  manaCost: "{R}{W}{W}",
  colors: ["R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 3,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${RETURN_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        filter: {
          typesAnyOf: ["instant", "sorcery"],
          targets: { permanent: { type: "creature", controlledBy: "you" } },
        },
      },
      targets: [],
      effect: { kind: "exile-spell-as-it-resolves", returnAtNextEndStep: true },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
