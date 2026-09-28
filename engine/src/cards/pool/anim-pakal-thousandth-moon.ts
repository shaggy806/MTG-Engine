import { defineCard } from "../define.js";

// X reads the +1/+1 counters on Anim Pakal as it last existed if it has left
// the battlefield by then (ruling) — `countersOn: "source"` reads last-known
// information. Each Gnome's target is chosen as it enters (rule 508.4).
const ATTACK_TEXT =
  "Whenever you attack with one or more non-Gnome creatures, put a +1/+1 counter on Anim Pakal, then create X 1/1 colorless Gnome artifact creature tokens that are tapped and attacking, where X is the number of +1/+1 counters on Anim Pakal.";

export default defineCard({
  name: "Anim Pakal, Thousandth Moon",
  manaCost: "{1}{R}{W}",
  colors: ["R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 1,
  toughness: 2,
  text: ATTACK_TEXT,
  triggered: [
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1, filter: { notSubtypes: ["Gnome"] } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          {
            kind: "create-token",
            token: "Gnome Token",
            count: { countersOn: "source", counter: "+1/+1" },
            tapped: true,
            attacking: "choose",
          },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
