import { defineCard } from "../define.js";

const DRAW_TEXT = "Whenever a Wolf or Werewolf you control deals combat damage to a player, draw a card.";
const PUMP_TEXT = "{X}{R}{G}: Target Wolf or Werewolf you control gets +X/+0 and gains trample until end of turn.";

/** The nightbound back face of Tovolar, Dire Overlord. */
export default defineCard({
  name: "Tovolar, the Midnight Scourge",
  // A back face has no Scryfall card of its own name — point at its art.
  art: "https://cards.scryfall.io/art_crop/back/f/9/f953fad3-0cd1-48aa-8ed9-d7d2e293e6e2.jpg",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Werewolf"],
  power: 4,
  toughness: 4,
  keywords: ["nightbound"],
  text: `${DRAW_TEXT}\n${PUMP_TEXT}\nNightbound (If a player casts at least two spells during their own turn, it becomes day next turn.)`,
  triggered: [
    {
      trigger: {
        on: "deals-combat-damage-to-player",
        who: "you-control",
        filter: { type: "creature", subtypes: ["Wolf", "Werewolf"] },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{X}{R}{G}", tap: false },
      targets: [{ kind: "permanent", filter: { type: "creature", subtypes: ["Wolf", "Werewolf"], controlledBy: "you" } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt", target: 0, power: "x", toughness: 0, duration: "end-of-turn" },
          { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
  faces: ["Tovolar, Dire Overlord", "Tovolar, the Midnight Scourge"],
  transform: true,
});
