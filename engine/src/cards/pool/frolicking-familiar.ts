import { defineCard } from "../define.js";

export default defineCard({
  name: "Frolicking Familiar",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Otter", "Wizard"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nWhenever you cast an instant or sorcery spell, this creature gets +1/+1 until end of turn.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever you cast an instant or sorcery spell, this creature gets +1/+1 until end of turn.",
    },
  ],
  faces: ["Frolicking Familiar", "Blow Off Steam"],
  adventure: true,
});
