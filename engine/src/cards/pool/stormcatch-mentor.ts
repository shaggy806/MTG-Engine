import { defineCard } from "../define.js";

const PROWESS = "Prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.)";

export default defineCard({
  name: "Stormcatch Mentor",
  manaCost: "{U}{R}",
  colors: ["U", "R"],
  types: ["creature"],
  subtypes: ["Otter", "Wizard"],
  power: 1,
  toughness: 1,
  keywords: ["haste"],
  text: `Haste\n${PROWESS}\nInstant and sorcery spells you cast cost {1} less to cast.`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { typesAnyOf: ["instant", "sorcery"] }, caster: "you", reduceGeneric: 1 },
      text: "Instant and sorcery spells you cast cost {1} less to cast.",
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: PROWESS,
    },
  ],
});
