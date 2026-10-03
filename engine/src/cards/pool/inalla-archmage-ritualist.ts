import { defineCard } from "../define.js";

const EMINENCE_TEXT =
  "Eminence — Whenever another nontoken Wizard you control enters, if Inalla is in the command zone or on " +
  "the battlefield, you may pay {1}. If you do, create a token that's a copy of that Wizard. The token gains " +
  "haste. Exile it at the beginning of the next end step.";
const DRAIN_TEXT = "Tap five untapped Wizards you control: Target player loses 7 life.";

// The rulings this follows:
// - Eminence (an ability word, rule 207.2c — the text is what works): the
//   trigger works from the command zone too, and
//   Inalla must still be there — the same object — as it resolves.
// - {1} is paid once per resolution, for one token.
// - A Wizard that has left by then is copied as it last existed (rule 608.2h);
//   one copying something else is copied as what it copied.
// - "The token gains haste" isn't a copy exception: it's granted after the
//   token is made, so a copy of the token doesn't have it.
// - The drain may tap any untapped Wizards, Inalla and ones that just arrived
//   included: tapping them isn't {T} (rule 302.6).
export default defineCard({
  name: "Inalla, Archmage Ritualist",
  manaCost: "{2}{U}{B}{R}",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 4,
  toughness: 5,
  text: `${EMINENCE_TEXT}\n${DRAIN_TEXT}`,
  triggered: [
    {
      fromCommandZone: true,
      condition: { kind: "source-zone", zones: ["command", "battlefield"], sameObject: true },
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { token: false, subtype: "Wizard" },
        otherOnly: true,
      },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {1} to create a token copy of that Wizard?",
        cost: "{1}",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "create-token-copy", of: "trigger-object", count: 1, who: "you", exileAtEndStep: true },
            { kind: "grant-keyword-all", filter: { thisWay: "created" }, keyword: "haste", duration: "permanent" },
          ],
        },
      },
      resolve: null,
      text: EMINENCE_TEXT,
    },
  ],
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 5, filter: { subtype: "Wizard", controlledBy: "you" }, includeSelf: true },
      },
      targets: ["player"],
      effect: { kind: "lose-life", amount: 7, target: 0 },
      resolve: null,
      text: DRAIN_TEXT,
    },
  ],
});
