import { defineCard } from "../define.js";

const TEXT =
  "{2}, {T}: Copy target triggered ability you control. You may choose new targets for the copy. (A " +
  'triggered ability uses the words "when," "whenever," or "at.")';

// The rulings this follows: the copy is another instance of the ability on
// the stack, with the original's source, modes, targets and X (a division of
// damage can't change); what's chosen or paid as it resolves is chosen or
// paid again for the copy; a copied linked ability is linked too. A Saga's
// chapter ability is a triggered ability (rule 714.2b); an activated one
// isn't a target.
export default defineCard({
  name: "Strionic Resonator",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: TEXT,
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: [{ kind: "ability", whose: "you", abilityKind: "triggered" }],
      effect: { kind: "copy-ability", target: 0, newTargets: true },
      resolve: null,
      text: TEXT,
    },
  ],
});
