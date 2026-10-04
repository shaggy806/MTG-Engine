import { defineCard } from "../define.js";

// EDHREC rank 5729.
//
// Rulings:
//   [2022-10-14] You choose the target creature as you put Steel Seraph's triggered ability on the
//     stack. You choose which ability that creature gains as the ability resolves.
//   [2022-10-14] When cast as a prototyped spell, that spell has the mana cost, power, and
//     toughness characteristics shown in its colored, secondary text box rather than the normal
//     values of those characteristics. Its color and mana value are determined by that mana cost.
//     The permanent that spell becomes as it resolves has the same characteristics. If the spell
//     leaves the stack in any other way, or the permanent it becomes leaves the battlefield, it
//     immediately resumes using its normal characteristics.
//   [2022-10-14] A prototype card is a colorless card in every zone except the stack or the
//     battlefield, as well as while on the stack or the battlefield if not cast as a prototyped
//     spell.
//
// Prototype is Combat Thresher's `prototype`. "Your choice of" is chosen as the
// ability resolves (the ruling) — Orcish Medicine's unannounced `modal` over
// the target chosen as the trigger went on the stack.

const COMBAT_TEXT =
  "At the beginning of combat on your turn, target creature you control gains your choice of flying, vigilance, or lifelink until end of turn.";

export default defineCard({
  name: "Steel Seraph",
  manaCost: "{6}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Angel"],
  power: 5,
  toughness: 4,
  keywords: ["flying"],
  text: `Prototype {1}{W}{W} — 3/3 (You may cast this spell with different mana cost, color, and size. It keeps its abilities and types.)\nFlying\n${COMBAT_TEXT}`,
  prototype: { cost: "{1}{W}{W}", power: 3, toughness: 3 },
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: ["creature-you-control"],
      effect: {
        kind: "modal",
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: "Flying",
            effect: { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
          },
          {
            text: "Vigilance",
            effect: { kind: "grant-keyword", target: 0, keyword: "vigilance", duration: "end-of-turn" },
          },
          {
            text: "Lifelink",
            effect: { kind: "grant-keyword", target: 0, keyword: "lifelink", duration: "end-of-turn" },
          },
        ],
      },
      resolve: null,
      text: COMBAT_TEXT,
    },
  ],
});
