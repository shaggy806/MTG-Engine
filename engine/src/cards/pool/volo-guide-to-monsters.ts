import { defineCard } from "../define.js";

// Top-commanders rank 247. Volo counts among the creatures you control; a
// changeling on either side shares every creature type, and a creature spell
// with no creature type shares none (rule 702.73a). The copy keeps the
// spell's {X} and the costs paid for it, isn't cast, and becomes a token as
// it resolves (rule 608.3f) — one that wasn't "created".
const COPY_TEXT =
  "Whenever you cast a creature spell that doesn't share a creature type with a creature you control or a " +
  "creature card in your graveyard, copy that spell. (A copy of a creature spell becomes a token.)";

export default defineCard({
  name: "Volo, Guide to Monsters",
  manaCost: "{2}{G}{U}",
  colors: ["G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 3,
  toughness: 2,
  text: COPY_TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "creature" }, sharesNoCreatureType: true },
      targets: [],
      effect: { kind: "copy-spell", target: "trigger-spell" },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
