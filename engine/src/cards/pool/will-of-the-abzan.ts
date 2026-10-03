import type { TargetSpec } from "../../target.js";
import { defineCard } from "../define.js";

const EDICT_MODE =
  "Any number of target opponents each sacrifice a creature with the greatest power among creatures that player " +
  "controls and lose 3 life.";
const RETURN_MODE = "Return target creature card from your graveyard to the battlefield.";

// "Any number of target opponents": up to one slot per opponent, each a
// different one — a game seats at most four, so three. (An any-number group
// can't sit in a mode.) Their sacrifices are one edict (`simultaneous`):
// each chooses among their own tied creatures in turn order, knowing the
// choices before theirs, and they all go together (rule 101.4). "Choose
// both" while you control a commander — anyone's (the ruling) — is
// `maxModesIf`, asked once as the modes are chosen.
const opponents: TargetSpec[] = [
  { kind: "optional", of: "opponent" },
  { kind: "optional", of: { kind: "other", of: "opponent", than: { slot: 0 } } },
  { kind: "optional", of: { kind: "other", of: "opponent", than: { slots: [0, 1] } } },
];

export default defineCard({
  name: "Will of the Abzan",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Choose one. If you control a commander as you cast this spell, you may choose both instead.\n" +
    `• ${EDICT_MODE}\n• ${RETURN_MODE}`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    maxModesIf: { condition: { kind: "controls", filter: { isCommander: true }, atLeast: 1 }, maxModes: 2 },
    modes: [
      {
        text: EDICT_MODE,
        targets: opponents,
        effect: {
          kind: "sequence",
          effects: [
            {
              kind: "for-each-target",
              from: 0,
              effect: {
                kind: "sacrifice",
                who: "target",
                filter: { type: "creature", greatestAmongItsController: { of: "power", among: { type: "creature" } } },
                count: 1,
              },
              simultaneous: true,
            },
            {
              kind: "for-each-target",
              from: 0,
              effect: { kind: "lose-life", amount: 3, target: 0 },
              simultaneous: true,
            },
          ],
        },
      },
      {
        text: RETURN_MODE,
        targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
        effect: { kind: "put-onto-battlefield", target: 0 },
      },
    ],
  },
});
