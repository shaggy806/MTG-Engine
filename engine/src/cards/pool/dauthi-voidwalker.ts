import { defineCard } from "../define.js";

// An opponent's card that would go to their graveyard from anywhere is
// exiled instead with a void counter — so their nontoken creatures don't die
// and nothing sees them die; a discard is still a discard; tokens still die
// (the rulings). The last ability chooses (doesn't target) such a card, and
// it may be played this turn only without paying its mana cost — X is 0, an
// additional cost is still paid — and at its normal timing (the rulings).
const REPLACE_TEXT =
  "If a card would be put into an opponent's graveyard from anywhere, instead exile it with a void counter on it.";
const PLAY_TEXT =
  "{T}, Sacrifice this creature: Choose an exiled card an opponent owns with a void counter on it. You may play it this turn without paying its mana cost.";

export default defineCard({
  name: "Dauthi Voidwalker",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Dauthi", "Rogue"],
  power: 3,
  toughness: 2,
  keywords: ["shadow"],
  text: `Shadow (This creature can block or be blocked by only creatures with shadow.)\n${REPLACE_TEXT}\n${PLAY_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "would-be-put-into-graveyard",
        instead: "exile",
        // A card: a token isn't one, and still dies.
        filter: { ownedBy: "opponent", token: false },
        withCounters: { kind: "void", amount: 1 },
      },
      text: REPLACE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "choose-exiled-to-play",
        filter: { ownedBy: "opponent", counters: { kind: "void", compare: { op: "gte", n: 1 } } },
        free: true,
      },
      resolve: null,
      text: PLAY_TEXT,
    },
  ],
});
