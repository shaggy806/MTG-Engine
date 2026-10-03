import { defineCard } from "../define.js";

// Top-commanders rank 132. The rulings this follows: it triggers on a spell
// whose every target is Zada, however many slots that is, and nothing else;
// each copy targets one of your other creatures with every slot (rule
// 707.10d), and a creature the spell couldn't target (shroud, protection, a
// restriction) is skipped; the copies keep the original's modes, {X} and the
// costs paid for it, aren't cast, and go on the stack in the order you
// choose, above the original.
const COPY_TEXT =
  "Whenever you cast an instant or sorcery spell that targets only Zada, copy that spell for each other " +
  "creature you control that the spell could target. Each copy targets a different one of those creatures.";

export default defineCard({
  name: "Zada, Hedron Grinder",
  manaCost: "{3}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Goblin", "Ally"],
  power: 3,
  toughness: 3,
  text: COPY_TEXT,
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        filter: { typesAnyOf: ["instant", "sorcery"], targets: { only: true, source: true } },
      },
      targets: [],
      effect: {
        kind: "copy-spell",
        target: "trigger-spell",
        forEachItCouldTarget: { filter: { type: "creature", controlledBy: "you" }, other: true },
      },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
