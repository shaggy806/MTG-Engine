import { defineCard } from "../define.js";
import type { EffectSpec } from "../../effects.js";
import type { Keyword } from "../define.js";

const COMBAT_TEXT =
  "At the beginning of each combat, creatures you control gain first strike until end of turn if " +
  "a creature you control has first strike. The same is true for flying, deathtouch, double " +
  "strike, haste, hexproof, indestructible, lifelink, menace, reach, skulk, trample, and vigilance.";

// Each keyword is asked on resolution (the rulings), and the creatures that
// gain it are the ones there then. Skulk is left out: the engine has no
// skulk, so no creature can have it and its sentence can never apply — a
// card that grants skulk would have to add it here.
const SHARED: readonly Keyword[] = [
  "first-strike",
  "flying",
  "deathtouch",
  "double-strike",
  "haste",
  "hexproof",
  "indestructible",
  "lifelink",
  "menace",
  "reach",
  "trample",
  "vigilance",
];

const share = (keyword: Keyword): EffectSpec => ({
  kind: "conditional",
  condition: { kind: "controls", filter: { type: "creature", keyword }, atLeast: 1 },
  then: {
    kind: "grant-keyword-all",
    filter: { type: "creature", controlledBy: "you" },
    keyword,
    duration: "end-of-turn",
  },
});

export default defineCard({
  name: "Odric, Lunarch Marshal",
  manaCost: "{3}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 3,
  text: COMBAT_TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "any" },
      targets: [],
      effect: { kind: "sequence", effects: SHARED.map(share) },
      resolve: null,
      text: COMBAT_TEXT,
    },
  ],
});
