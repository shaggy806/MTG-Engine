import { defineCard } from "../define.js";

// #200 in top-commanders.txt.
//
// "If he was cast" is read off how he entered (`cast: true`), which never
// changes while he's on the battlefield.
const ENTER_TEXT = "When Anti-Venom enters, if he was cast, return target creature card from your graveyard to the battlefield.";
const PREVENT_TEXT = "If damage would be dealt to Anti-Venom, prevent that damage and put that many +1/+1 counters on him.";

export default defineCard({
  name: "Anti-Venom, Horrifying Healer",
  manaCost: "{W}{W}{W}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Symbiote", "Hero"],
  power: 5,
  toughness: 5,
  text: `${ENTER_TEXT}\n${PREVENT_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self", filter: { cast: true } },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "would-deal-damage",
        prevent: true,
        to: "self",
        then: { kind: "add-counter", target: "source", counter: "+1/+1", amount: "x" },
      },
      text: PREVENT_TEXT,
    },
  ],
});
