import { defineCard } from "../define.js";
import { firebending } from "../helpers.js";

// Top-commanders rank 13. "While Fire Lord Azula is attacking" is part of
// the trigger condition (rule 603.1), not an intervening "if": it's asked as
// the spell is cast, and the copy is made even if Azula has left combat, or
// the spell has been countered, by the time the ability resolves (the
// rulings). The copy keeps the spell's modes, {X} and the costs paid for it,
// isn't cast, resolves first, and a copy of a permanent spell becomes a token.
const FIREBENDING_TEXT =
  "Firebending 2 (Whenever this creature attacks, add {R}{R}. This mana lasts until end of combat.)";
const COPY_TEXT =
  "Whenever you cast a spell while Fire Lord Azula is attacking, copy that spell. You may choose new " +
  "targets for the copy. (A copy of a permanent spell becomes a token.)";

export default defineCard({
  name: "Fire Lord Azula",
  manaCost: "{1}{U}{B}{R}",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble"],
  power: 4,
  toughness: 4,
  text: `${FIREBENDING_TEXT}\n${COPY_TEXT}`,
  triggered: [
    firebending(2, FIREBENDING_TEXT),
    {
      trigger: { on: "cast-spell", who: "you" },
      whileCondition: { kind: "source", filter: { attacking: true } },
      targets: [],
      effect: { kind: "copy-spell", target: "trigger-spell", newTargets: true },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
