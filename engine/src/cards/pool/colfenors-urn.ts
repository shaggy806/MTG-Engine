import { defineCard } from "../define.js";

const DIES_TEXT =
  "Whenever a creature with toughness 4 or greater is put into your graveyard from the battlefield, you may exile it.";
const END_TEXT =
  "At the beginning of the end step, if three or more cards have been exiled with this artifact, sacrifice it. " +
  "If you do, return those cards to the battlefield under their owner's control.";

// "Your graveyard" is its owner's — a creature of yours an opponent had
// stolen counts — and its toughness is as it last existed on the battlefield.
// A token triggers it but has ceased to exist before it can be exiled (the
// ruling). The cards are exiled *with* the Urn (rule 607.2a), and the count
// is every card ever exiled with it, though some have left exile since (the
// ruling); "those cards" are the ones still there. Not sacrificed — gone, or
// another player's by then — nothing returns (the ruling).
export default defineCard({
  name: "Colfenor's Urn",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: `${DIES_TEXT}\n${END_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "dies",
        who: "any",
        filter: { type: "creature", ownedBy: "you", toughness: { op: "gte", n: 4 } },
      },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Exile it with Colfenor's Urn?",
        effect: { kind: "exile", target: "trigger-object", linked: true },
      },
      resolve: null,
      text: DIES_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      condition: { kind: "exiled-with-source", atLeast: 3 },
      targets: [],
      effect: {
        kind: "sacrifice-source",
        then: { kind: "return-exiled-by-source", linked: "battlefield" },
      },
      resolve: null,
      text: END_TEXT,
    },
  ],
});
