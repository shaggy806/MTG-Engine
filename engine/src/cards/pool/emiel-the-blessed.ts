import { defineCard } from "../define.js";

// EDHREC rank 2771.
//
// Rulings:
//   [2020-06-23] You choose whether to pay for Emiel's triggered ability while it's resolving. If
//     you do, no player may take other actions between the time you pay and the time the creature
//     has one or two +1/+1 counters on it.
//   [2020-06-23] When the card returns to the battlefield, it will be a new object with no
//     connection to the card that was exiled. Auras attached to the exiled creature will be put
//     into their owners' graveyards. Any Equipment will become unattached and remain on the
//     battlefield. Any counters on the exiled creature will cease to exist.
//   [2020-06-23] If the entering creature is a Unicorn, you still have to pay {G/W} to put two
//     +1/+1 counters on it.
//   [2020-06-23] Emiel's second ability triggers whenever any creature other than itself enters
//     the battlefield under your control, including those returned by its first ability.
//   [2020-06-23] While resolving Emiel's triggered ability, you can't pay {G/W} more than once to
//     put more counters on the creature.
//   [2020-06-23] If a token is exiled this way, it will cease to exist and won't return to the
//     battlefield.
// The pay is a `may` with a cost, asked as the trigger resolves; whether it's
// a Unicorn is asked once it's paid (Akoum Hellkite's trigger-object check).
const BLINK_TEXT =
  "{3}: Exile another target creature you control, then return it to the battlefield under its owner's control.";
const ENTER_TEXT =
  "Whenever another creature you control enters, you may pay {G/W}. If you do, put a +1/+1 counter on it. If it's a Unicorn, put two +1/+1 counters on it instead.";

export default defineCard({
  name: "Emiel the Blessed",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Unicorn"],
  power: 4,
  toughness: 4,
  text: `${BLINK_TEXT}\n${ENTER_TEXT} ({G/W} can be paid with either {G} or {W}.)`,
  activated: [
    {
      cost: { mana: "{3}", tap: false },
      targets: [{ kind: "other", of: "creature-you-control" }],
      effect: { kind: "flicker", target: 0 },
      resolve: null,
      text: BLINK_TEXT,
    },
  ],
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {G/W} to put a +1/+1 counter on it (two if it's a Unicorn)?",
        cost: "{G/W}",
        effect: {
          kind: "conditional",
          condition: { kind: "trigger-object", filter: { subtype: "Unicorn" } },
          then: { kind: "add-counter", target: "trigger-object", counter: "+1/+1", amount: 2 },
          else: { kind: "add-counter", target: "trigger-object", counter: "+1/+1", amount: 1 },
        },
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
