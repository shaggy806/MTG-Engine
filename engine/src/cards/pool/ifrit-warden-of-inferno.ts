import { defineCard } from "../define.js";

// The back face of Clive, Ifrit's Dominant: a Saga creature.
//
// Chapter III's return is a flicker of the source, which comes back front
// face up as Clive — a new object that's no Saga, so nothing sacrifices it.
const LUNGE_TEXT = "I — Lunge — Ifrit fights up to one other target creature.";
const BRIMSTONE_TEXT =
  "II, III — Brimstone — Add {R}{R}{R}{R}. If Ifrit has three or more lore counters on it, exile it, " +
  "then return it to the battlefield (front face up).";

export default defineCard({
  name: "Ifrit, Warden of Inferno",
  art: "https://cards.scryfall.io/art_crop/back/9/a/9a069e96-2786-493d-aca8-f70611435dbe.jpg",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["enchantment", "creature"],
  subtypes: ["Saga", "Demon"],
  power: 9,
  toughness: 9,
  text:
    "(As this Saga enters and after your draw step, add a lore counter.)\n" + `${LUNGE_TEXT}\n${BRIMSTONE_TEXT}`,
  chapters: [
    {
      at: [1],
      targets: [{ kind: "optional", of: { kind: "other", of: "creature" } }],
      effect: { kind: "fight", a: "source", b: 0 },
      resolve: null,
      text: LUNGE_TEXT,
    },
    {
      at: [2, 3],
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-mana", mana: "R", amount: 4 },
          {
            kind: "conditional",
            condition: { kind: "self-counters", counter: "lore", compare: { op: "gte", n: 3 } },
            then: { kind: "flicker", target: "source" },
          },
        ],
      },
      resolve: null,
      text: BRIMSTONE_TEXT,
    },
  ],
  faces: ["Clive, Ifrit's Dominant", "Ifrit, Warden of Inferno"],
  transform: true,
});
