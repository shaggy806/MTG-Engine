import { defineCard } from "../define.js";

const TEXT =
  "When Abdel Adrian enters, exile any number of other nonland permanents you control until Abdel Adrian " +
  "leaves the battlefield. Create a 1/1 white Soldier creature token for each permanent exiled this way.";

// The permanents are chosen on the board as the ability resolves, never
// Abdel Adrian itself. If Abdel Adrian has already left, nothing is exiled
// and no Soldier is made (the ruling). An exiled token ceases to exist and
// never comes back, but it still makes a Soldier (the ruling); the Soldiers
// stay when the exiled cards return, under their owners' control.
export default defineCard({
  name: "Abdel Adrian, Gorion's Ward",
  manaCost: "{4}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 4,
  toughness: 4,
  text: `${TEXT}\nChoose a Background (You can have a Background as a second commander.)`,
  pairing: { kind: "choose-a-background" },
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "source-on-battlefield" },
        then: {
          kind: "sequence",
          effects: [
            {
              kind: "choose-permanents",
              filter: { notTypes: ["land"], controlledBy: "you" },
              exceptSource: true,
              upTo: { countOf: { notTypes: ["land"], controlledBy: "you" } },
              then: { kind: "exile", target: 0, untilSourceLeaves: true },
              prompt: "Exile any number of other nonland permanents you control",
            },
            { kind: "create-token", token: "Soldier Token", count: { thisWay: "exiled" } },
          ],
        },
      },
      resolve: null,
      text: TEXT,
    },
    {
      // The return half of "until Abdel Adrian leaves the battlefield", as
      // an O-Ring's is (AUTHORING, "An O-Ring").
      trigger: { on: "leaves-battlefield", who: "self" },
      targets: [],
      effect: { kind: "return-exiled-by-source" },
      resolve: null,
      text: "When Abdel Adrian leaves the battlefield, return the exiled cards.",
    },
  ],
});
