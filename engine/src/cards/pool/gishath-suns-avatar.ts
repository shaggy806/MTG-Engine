import { defineCard } from "../define.js";

// Top-commanders rank 62. "That many" is the combat damage Gishath dealt
// (`triggerValue` of a deals-combat-damage-to-player trigger), and the cards
// are revealed to everyone, not just looked at. "Any number" is a `max` the
// choice clamps to the Dinosaur creature cards actually revealed. With fewer
// cards in library than the damage, it reveals what's there (the 2017
// ruling) — a reveal, not a draw, so it never decks you.
export default defineCard({
  name: "Gishath, Sun's Avatar",
  manaCost: "{5}{R}{G}{W}",
  colors: ["R", "G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dinosaur", "Avatar"],
  power: 7,
  toughness: 6,
  keywords: ["vigilance", "trample", "haste"],
  text:
    "Vigilance, trample, haste\n" +
    "Whenever Gishath deals combat damage to a player, reveal that many cards from the top of your library. " +
    "Put any number of Dinosaur creature cards from among them onto the battlefield and the rest on the bottom " +
    "of your library in a random order.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: { triggerValue: true },
        reveal: true,
        min: 0,
        max: 99,
        filter: { type: "creature", subtype: "Dinosaur" },
        destination: "battlefield",
        leftover: "bottom-random",
      },
      resolve: null,
      text:
        "Whenever Gishath deals combat damage to a player, reveal that many cards from the top of your library. " +
        "Put any number of Dinosaur creature cards from among them onto the battlefield and the rest on the " +
        "bottom of your library in a random order.",
    },
  ],
});
