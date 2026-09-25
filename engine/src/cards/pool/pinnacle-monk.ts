import { defineCard } from "../define.js";

export default defineCard({
  name: "Pinnacle Monk",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Djinn", "Monk"],
  power: 2,
  toughness: 2,
  text:
    "Prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.)\n" +
    "When this creature enters, return target instant or sorcery card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Prowess",
    },
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { typesAnyOf: ["instant", "sorcery"] } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "When this creature enters, return target instant or sorcery card from your graveyard to your hand.",
    },
  ],
  faces: ["Pinnacle Monk", "Mystic Peak"],
});
