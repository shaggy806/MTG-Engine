import { defineCard } from "../define.js";
import { partnerWithTrigger } from "../helpers.js";

// #331 in top-commanders.txt.
//
// "Cards you exiled" are the ones an effect of yours put there — Pako, Arcane
// Retriever's fetch counters, from every player's library — and the
// permission is Haldan's static ability, so it works only while Haldan is on
// the battlefield, for cards exiled before he arrived too (the rulings). Lands
// are played with the land drop; spells keep their timing (the ruling).
// "Noncreature spells" is judged as the spell cast, so an adventurer's
// Adventure qualifies (the ruling). The any-colour spending is only for a
// spell cast this way (rule 118.14); `{C}` pips still want colourless mana.
const PLAY_TEXT =
  "You may play lands and cast noncreature spells from among cards you exiled that have fetch counters on them, " +
  "and you may spend mana as though it were mana of any color to cast those spells.";

export default defineCard({
  name: "Haldan, Avid Arcanist",
  manaCost: "{2}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 4,
  pairing: { kind: "partner-with", name: "Pako, Arcane Retriever" },
  text:
    "Partner with Pako, Arcane Retriever (When this creature enters, target player may put Pako into their " +
    `hand from their library, then shuffle.)\n${PLAY_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      playFromExile: {
        filter: { counters: { kind: "fetch", compare: { op: "gte", n: 1 } } },
        exiledByYou: true,
        spells: { notTypes: ["creature"] },
        spendAs: "any-color",
      },
      text: PLAY_TEXT,
    },
  ],
  triggered: [partnerWithTrigger("Pako, Arcane Retriever")],
});
