import { defineCard, type StaticAbility } from "../define.js";

const TYPES = ["artifact", "creature", "enchantment", "instant", "sorcery"] as const;

// One reduction per type, each live only for the type named as it entered —
// generic mana only (the ruling). A Cloud Key that enters without being asked
// (a token copy) has nothing chosen and reduces nothing.
const reduction = (type: (typeof TYPES)[number]): StaticAbility => ({
  affects: { scope: "self" },
  condition: { kind: "chosen-on-enter", value: type },
  costModification: { applies: { type }, caster: "you", reduceGeneric: 1 },
  text: `Spells you cast of the chosen type (${type}) cost {1} less to cast.`,
});

export default defineCard({
  name: "Cloud Key",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text:
    "As this artifact enters, choose artifact, creature, enchantment, instant, or sorcery.\n" +
    "Spells you cast of the chosen type cost {1} less to cast.",
  chooseOnEnter: [...TYPES],
  static: TYPES.map(reduction),
});
