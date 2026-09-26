import { defineCard } from "../define.js";

const RETURN_TEXT =
  "At the beginning of your upkeep, return target creature card from your graveyard to the battlefield.";
const EDICT_TEXT =
  "At the beginning of each opponent's upkeep, that player sacrifices a creature of their choice.";

// The edict fires once on each opponent's upkeep and "that player" is the
// one whose upkeep it is (`active-player`), who chooses as it resolves.
export default defineCard({
  name: "Sheoldred, Whispering One",
  manaCost: "{5}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Praetor"],
  power: 6,
  toughness: 6,
  keywords: ["swampwalk"],
  text:
    "Swampwalk (This creature can't be blocked as long as defending player controls a Swamp.)\n" +
    `${RETURN_TEXT}\n${EDICT_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: RETURN_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "upkeep", who: "opponent" },
      targets: [],
      effect: { kind: "sacrifice", who: "active-player", filter: { type: "creature" }, count: 1 },
      resolve: null,
      text: EDICT_TEXT,
    },
  ],
});
