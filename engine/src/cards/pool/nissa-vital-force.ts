import { defineCard } from "../define.js";

// EDHREC rank 4932.
//
// The +1 can target an untapped land (its ruling); the land keeps its
// other types and abilities as a 5/5 until your next turn.
const PLUS =
  "+1: Untap target land you control. Until your next turn, it becomes a 5/5 Elemental creature with haste. It's still a land.";
const MINUS = "−3: Return target permanent card from your graveyard to your hand.";
const EMBLEM = "Whenever a land you control enters, you may draw a card.";
const ULTIMATE = `−6: You get an emblem with "${EMBLEM}"`;

export default defineCard({
  name: "Nissa, Vital Force",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Nissa"],
  loyalty: 5,
  text: `${PLUS}\n${MINUS}\n${ULTIMATE}`,
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: ["land-you-control"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "untap", target: 0 },
          {
            kind: "animate",
            target: 0,
            power: 5,
            toughness: 5,
            addTypes: ["creature"],
            addSubtypes: ["Elemental"],
            keywords: ["haste"],
            duration: "until-your-next-turn",
          },
        ],
      },
      resolve: null,
      text: PLUS,
    },
    {
      loyaltyCost: -3,
      cost: { mana: null, tap: false },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { notTypes: ["instant", "sorcery"] } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: MINUS,
    },
    {
      loyaltyCost: -6,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "create-emblem",
        text: EMBLEM,
        triggered: [
          {
            trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
            targets: [],
            effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
            resolve: null,
            text: EMBLEM,
          },
        ],
      },
      resolve: null,
      text: ULTIMATE,
    },
  ],
});
