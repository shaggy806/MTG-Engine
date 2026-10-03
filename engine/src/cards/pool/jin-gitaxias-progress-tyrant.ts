import { defineCard } from "../define.js";

const COPY_TEXT =
  "Whenever you cast an artifact, instant, or sorcery spell, copy that spell. You may choose new targets for " +
  "the copy. This ability triggers only once each turn. (A copy of a permanent spell becomes a token.)";
const COUNTER_TEXT =
  "Whenever an opponent casts an artifact, instant, or sorcery spell, counter that spell. This ability " +
  "triggers only once each turn.";

// "Triggers only once each turn" (`oncePerTurn`) is per ability of this object,
// not "your first such spell each turn": with an artifact cast before
// Jin-Gitaxias arrived, the next one still triggers it. The second ability
// triggers once each turn in all, not once per opponent (the ruling). The
// copy is made even of a spell countered in response, and resolves first.
export default defineCard({
  name: "Jin-Gitaxias, Progress Tyrant",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Praetor"],
  power: 5,
  toughness: 5,
  text: `${COPY_TEXT}\n${COUNTER_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["artifact", "instant", "sorcery"] } },
      oncePerTurn: true,
      targets: [],
      effect: { kind: "copy-spell", target: "trigger-spell", newTargets: true },
      resolve: null,
      text: COPY_TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "opponent", filter: { typesAnyOf: ["artifact", "instant", "sorcery"] } },
      oncePerTurn: true,
      targets: [],
      effect: { kind: "counter", target: "trigger-object" },
      resolve: null,
      text: COUNTER_TEXT,
    },
  ],
});
