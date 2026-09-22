import { defineCard } from "../define.js";

// Top-commanders rank 163. Partner is read off the rules text by
// `validateCommanderDeck`, so the reminder line is the whole of it here.
// `otherOnly` can't change anything for an opponent-only trigger (Ishai's own
// cast is its controller's), but keeps the stack copy of Ishai out of it
// however the scan is widened later.
export default defineCard({
  name: "Ishai, Ojutai Dragonspeaker",
  manaCost: "{2}{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Bird", "Monk"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Whenever an opponent casts a spell, put a +1/+1 counter on Ishai.\n" +
    "Partner (You can have two commanders if both have partner.)",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent", otherOnly: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever an opponent casts a spell, put a +1/+1 counter on Ishai.",
    },
  ],
});
