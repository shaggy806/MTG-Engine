import { defineCard } from "../define.js";

// needed-cards P16. Summon's target reads the X chosen for it ("mana value
// X"), so the ability is offered once per X some Saga card in the graveyard
// has. The finality counter needs nothing more: `moveObject` exiles a
// permanent carrying one that would go to a graveyard (rule 122). A Saga
// creature ("Summon: …") is what makes "it gains haste" matter.
const LANDFALL_TEXT =
  "Landfall — Whenever a land you control enters, you may discard a card. If you do, draw a card.";
const SUMMON_TEXT =
  "Summon — {X}, {T}: Return target Saga card with mana value X from your graveyard to the " +
  "battlefield with a finality counter on it. It gains haste until end of turn. Activate only " +
  "as a sorcery.";

export default defineCard({
  name: "Rydia, Summoner of Mist",
  manaCost: "{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 1,
  toughness: 2,
  text: `${LANDFALL_TEXT}\n${SUMMON_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Discard a card, then draw a card?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "discard", target: "you", amount: 1 },
            { kind: "draw", amount: 1 },
          ],
        },
      },
      resolve: null,
      text: LANDFALL_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{X}", tap: true },
      sorcerySpeed: true,
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { subtype: "Saga", manaValue: { op: "eq", n: "x" } },
        },
      ],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "put-onto-battlefield", target: 0, withCounters: { kind: "finality", amount: 1 } },
          { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: SUMMON_TEXT,
    },
  ],
});
