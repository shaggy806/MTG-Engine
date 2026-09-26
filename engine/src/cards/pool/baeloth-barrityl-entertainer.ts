import { defineCard } from "../define.js";

// #438 in top-commanders.txt.
//
// The goad is a static one (the ruling): not "until your next turn", but for
// exactly as long as Baeloth is on the battlefield, has the ability and has
// the greater power — read live, with Baeloth's controller as the goader.
// "A goaded attacking or blocking creature" is read as the creature last
// existed on the battlefield (rule 603.10a), whoever goaded it and however.
const GOAD_TEXT =
  "Creatures your opponents control with power less than Baeloth Barrityl's power are goaded. " +
  "(They attack each combat if able and attack a player other than you if able.)";
const TREASURE_TEXT = "Whenever a goaded attacking or blocking creature dies, you create a Treasure token.";

export default defineCard({
  name: "Baeloth Barrityl, Entertainer",
  manaCost: "{4}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman"],
  power: 2,
  toughness: 5,
  pairing: { kind: "choose-a-background" },
  text: `${GOAD_TEXT}\n${TREASURE_TEXT}\nChoose a Background (You can have a Background as a second commander.)`,
  static: [
    {
      affects: {
        scope: "filter",
        filter: {
          type: "creature",
          controlledBy: "opponent",
          power: { op: "lt", n: { amount: { powerOf: "source" } } },
        },
      },
      goads: true,
      text: GOAD_TEXT,
    },
  ],
  triggered: [
    {
      trigger: {
        on: "dies",
        who: "any",
        filter: { type: "creature", goaded: true, anyOf: [{ attacking: true }, { blocking: true }] },
      },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: TREASURE_TEXT,
    },
  ],
});
