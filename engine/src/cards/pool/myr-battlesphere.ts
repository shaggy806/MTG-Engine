import { defineCard } from "../define.js";

// X is chosen as the attack trigger resolves: any number of untapped Myr you
// control, the four tokens or any other, including ones that came under your
// control this turn — tapping one for a cost-free effect isn't a {T} cost
// (the rulings). The bonus needs Battlesphere still on the battlefield; the
// damage doesn't — it deals it as it last existed, to what it was attacking
// (the ruling) — but one removed from combat since isn't attacking anything.
const ETB_TEXT = "When this creature enters, create four 1/1 colorless Myr artifact creature tokens.";
const ATTACK_TEXT =
  "Whenever this creature attacks, you may tap X untapped Myr you control. If you do, this creature gets +X/+0 until end of turn and deals X damage to the player or planeswalker it's attacking.";
const UNTAPPED_MYR = { subtype: "Myr", tapped: false, controlledBy: "you" } as const;

export default defineCard({
  name: "Myr Battlesphere",
  manaCost: "{7}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Myr", "Construct"],
  power: 4,
  toughness: 7,
  text: `${ETB_TEXT}\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Myr Token", count: 4 },
      resolve: null,
      text: ETB_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "choose-permanents",
            filter: UNTAPPED_MYR,
            upTo: { countOf: UNTAPPED_MYR },
            then: { kind: "tap", target: 0 },
            prompt: "Tap any number of untapped Myr you control",
          },
          {
            kind: "modify-pt",
            target: "source",
            power: { thisWay: "tapped" },
            toughness: 0,
            duration: "end-of-turn",
          },
          {
            kind: "conditional",
            condition: { kind: "trigger-object", filter: { attacking: true } },
            then: { kind: "damage", amount: { thisWay: "tapped" }, toTriggerRecipient: true },
          },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
