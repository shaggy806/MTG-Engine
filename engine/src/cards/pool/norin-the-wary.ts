import { defineCard } from "../define.js";

/**
 * One ability with two trigger events (rule 603.2), written as two entries
 * sharing an effect: each event triggers it once either way. The return is
 * linked to the exile (rule 610.3), so when several triggers are waiting, the
 * first exiles Norin and the rest find a new object — or nothing — and do
 * nothing, not even set up a second return.
 */
const effect = {
  kind: "flicker",
  target: "source",
  returnAt: "next-end-step",
  returnText: "Return Norin the Wary to the battlefield under its owner's control.",
} as const;

const text =
  "When a player casts a spell or a creature attacks, exile Norin. Return it to the " +
  "battlefield under its owner's control at the beginning of the next end step.";

export default defineCard({
  name: "Norin the Wary",
  manaCost: "{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 2,
  toughness: 1,
  text,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "any" },
      targets: [],
      effect,
      resolve: null,
      text,
    },
    {
      trigger: { on: "attacks", who: "any" },
      targets: [],
      effect,
      resolve: null,
      text,
    },
  ],
});
