import { defineCard } from "../define.js";

// "Creature cards" includes a card with creature among other types, an
// artifact creature say (the ruling). They all leave the graveyards together
// and enter together, under your control whoever owns them, each a black
// Zombie as it enters (rule 614.12) — a colourless one simply black. The
// Grimoire is sacrificed as the cost is paid, so it's gone before they
// return.
const STUDY_TEXT = "{1}, {T}, Discard a card: Put a study counter on Grimoire of the Dead.";
const RAISE_TEXT =
  "{T}, Remove three study counters from Grimoire of the Dead and sacrifice it: Put all creature cards from all graveyards onto the battlefield under your control. They're black Zombies in addition to their other colors and types.";

export default defineCard({
  name: "Grimoire of the Dead",
  manaCost: "{4}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Book"],
  text: `${STUDY_TEXT}\n${RAISE_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}", tap: true, discard: { count: 1 } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "study", amount: 1 },
      resolve: null,
      text: STUDY_TEXT,
    },
    {
      cost: { mana: null, tap: true, removeCounter: { kind: "study", count: 3 }, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "return-from-graveyard",
        from: "all-graveyards",
        filter: { type: "creature" },
        destination: "battlefield",
        count: "all",
        enterAs: { addColors: ["B"], addSubtypes: ["Zombie"] },
      },
      resolve: null,
      text: RAISE_TEXT,
    },
  ],
});
