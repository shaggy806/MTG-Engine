import { defineCard } from "../define.js";

/** The back face of Sidequest: Raise a Chocobo — the pool's `transforms`
 * trigger (rule 712.10). */
export default defineCard({
  name: "Black Chocobo",
  // A back face has no Scryfall card of its own name — point at its art.
  art: "https://cards.scryfall.io/art_crop/back/0/c/0cbf911c-a721-4b84-8645-d83a0966be18.jpg",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 2,
  toughness: 2,
  text:
    "When this permanent transforms into Black Chocobo, search your library for a land card, " +
    "put it onto the battlefield tapped, then shuffle.\n" +
    "Landfall — Whenever a land you control enters, Birds you control get +1/+0 until end of turn.",
  triggered: [
    {
      trigger: { on: "transforms", who: "self", intoFront: false },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "land" },
        destination: "battlefield",
        min: 0,
        max: 1,
        enterTapped: true,
      },
      resolve: null,
      text:
        "When this permanent transforms into Black Chocobo, search your library for a land " +
        "card, put it onto the battlefield tapped, then shuffle.",
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { subtype: "Bird", controlledBy: "you" },
        power: 1,
        toughness: 0,
        duration: "end-of-turn",
      },
      resolve: null,
      text:
        "Landfall — Whenever a land you control enters, Birds you control get +1/+0 until end " +
        "of turn.",
    },
  ],
  faces: ["Sidequest: Raise a Chocobo", "Black Chocobo"],
  transform: true,
});
