import { defineCard } from "../define.js";

// "Put all": min and max are the six cards looked at, which the choice clamps
// to the Goblins that qualify, so every one goes (Ponder's "all three" shape).
// The attack bonus is counted once, as that trigger resolves (its ruling).
const OTHER_GOBLINS = { countOf: { subtype: "Goblin", controlledBy: "you" }, excludeSelf: true } as const;

// EDHREC rank 3985.
//
// Rulings:
//   [2020-06-23] If a card in a player's library has {X} in its mana cost, X is considered to be
//     0.
//   [2020-06-23] The bonus Muxus gets is determined only as its last ability resolves. Once that
//     happens, the bonus won't change later in the turn even if the number of Goblins you control
//     changes.

export default defineCard({
  name: "Muxus, Goblin Grandee",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Goblin", "Noble"],
  power: 4,
  toughness: 4,
  text: "When Muxus enters, reveal the top six cards of your library. Put all Goblin creature cards with mana value 5 or less from among them onto the battlefield and the rest on the bottom of your library in a random order.\nWhenever Muxus attacks, it gets +1/+1 until end of turn for each other Goblin you control.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 6,
        reveal: true,
        min: 6,
        max: 6,
        filter: { type: "creature", subtype: "Goblin", manaValue: { op: "lte", n: 5 } },
        destination: "battlefield",
        leftover: "bottom-random",
      },
      resolve: null,
      text: "When Muxus enters, reveal the top six cards of your library. Put all Goblin creature cards with mana value 5 or less from among them onto the battlefield and the rest on the bottom of your library in a random order.",
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "modify-pt",
        target: "source",
        power: OTHER_GOBLINS,
        toughness: OTHER_GOBLINS,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Whenever Muxus attacks, it gets +1/+1 until end of turn for each other Goblin you control.",
    },
  ],
});
