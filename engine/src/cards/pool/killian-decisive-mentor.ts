import { defineCard } from "../define.js";

// #234 in top-commanders.txt.
//
// "Creatures that are enchanted by an Aura you control" are anyone's — the
// point of the card is putting Auras on opponents' creatures and goading them
// — so the batched attack trigger listens to every player's attack and
// counts only those creatures (`enchantedBy: "you"`).
const GOAD_TEXT =
  "Whenever an enchantment you control enters, tap up to one target creature and goad it. " +
  "(Until your next turn, that creature attacks each combat if able and attacks a player other than you if able.)";
const DRAW_TEXT = "Whenever one or more creatures that are enchanted by an Aura you control attack, draw a card.";

export default defineCard({
  name: "Killian, Decisive Mentor",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warlock"],
  power: 2,
  toughness: 3,
  text: `${GOAD_TEXT}\n${DRAW_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "enchantment" } },
      targets: [{ kind: "optional", of: "creature" }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "tap", target: 0 },
          { kind: "goad", target: 0 },
        ],
      },
      resolve: null,
      text: "Whenever an enchantment you control enters, tap up to one target creature and goad it.",
    },
    {
      trigger: { on: "attacks-batch", who: "any", filter: { type: "creature", enchantedBy: "you" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
