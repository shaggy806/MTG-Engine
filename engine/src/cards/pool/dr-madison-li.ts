import { defineCard } from "../define.js";

export default defineCard({
  name: "Dr. Madison Li",
  manaCost: "{U}{R}{W}",
  colors: ["U", "R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Scientist"],
  power: 2,
  toughness: 3,
  text:
    "Whenever you cast an artifact spell, you get {E} (an energy counter).\n" +
    "{T}, Pay {E}: Target creature gets +1/+0 and gains trample and haste until end of turn.\n" +
    "{T}, Pay {E}{E}{E}: Draw a card.\n" +
    "{T}, Pay {E}{E}{E}{E}{E}: Return target artifact card from your graveyard to the battlefield tapped.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "get-energy", amount: 1 },
      resolve: null,
      text: "Whenever you cast an artifact spell, you get {E} (an energy counter).",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true, payEnergy: 1 },
      targets: ["creature"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt", target: 0, power: 1, toughness: 0, duration: "end-of-turn" },
          { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
          { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: "{T}, Pay {E}: Target creature gets +1/+0 and gains trample and haste until end of turn.",
    },
    {
      cost: { mana: null, tap: true, payEnergy: 3 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{T}, Pay {E}{E}{E}: Draw a card.",
    },
    {
      cost: { mana: null, tap: true, payEnergy: 5 },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "artifact" } }],
      effect: { kind: "put-onto-battlefield", target: 0, enterTapped: true },
      resolve: null,
      text: "{T}, Pay {E}{E}{E}{E}{E}: Return target artifact card from your graveyard to the battlefield tapped.",
    },
  ],
});
