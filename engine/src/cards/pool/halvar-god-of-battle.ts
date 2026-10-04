import { defineCard } from "../define.js";

// EDHREC rank 2376.
//
// Rulings:
//   [2021-02-05] The mana value of a modal double-faced card is based on the characteristics of
//     the face that's being considered. On the stack and battlefield, consider whichever face is
//     up. In all other zones, consider only the front face. This is different than how the mana
//     value of a transforming double-faced card is determined.
//   [2021-02-05] If Sword of the Realms is attached to a token creature that dies, the Sword's
//     triggered ability will trigger, but the token will cease to exist after going to the
//     graveyard. It won't be returned to its owner's hand.
//   [2021-02-05] In the Commander variant, a double-faced card's color identity is determined by
//     the mana costs and mana symbols in the rules text of both faces combined. If either face has
//     a color indicator or basic land type, those are also considered.
//   [2021-02-05] If an effect allows you to play a land or cast a spell from among a group of
//     cards, you may play or cast a modal double-faced card with any face that fits the criteria
//     of that effect.
//   [2021-02-05] If the creature equipped by Sword of the Realms dies but leaves the graveyard
//     before the triggered ability resolves, it won't be returned to its owner's hand. It will
//     just stay wherever it went.
//   [2021-02-05] There is a single triangle icon in the top left corner of the front face. There
//     is a double triangle icon in the top left corner of the back face.
//   [2021-02-05] To determine whether it is legal to play a modal double-faced card, consider only
//     the characteristics of the face you're playing and ignore the other face's characteristics.
//   [2021-02-05] If either target of the triggered ability is an illegal target as the ability
//     resolves, the ability won't do anything. If both targets are illegal, the ability won't
//     resolve. If the Aura or Equipment is already attached to the target creature, nothing
//     happens.
//   [2021-02-05] If an effect instructs a player to choose a card name, the name of either face
//     may be chosen. If that effect or a linked ability refers to a spell with the chosen name
//     being cast and/or a land with the chosen name being played, it considers only the chosen
//     name, not the other face's name.
//   [2021-02-05] If an effect allows you to play a specific modal double-faced card, you may cast
//     it as a spell or play it as a land, as determined by which face you choose to play. If an
//     effect allows you to cast (rather than "play") a specific modal double-faced card, you can't
//     play it as a land.
//   [2021-02-05] If an effect puts a double-faced card onto the battlefield, it enters with its
//     front face up. If that front face can't be put onto the battlefield, it doesn't enter the
//     battlefield.
//   [2021-02-05] A creature you control is enchanted or equipped if there's an Aura or an
//     Equipment attached to it. You don't have to control that Aura or Equipment.
//   [2021-02-05] A modal double-faced card can't be transformed or be put onto the battlefield
//     transformed. Ignore any instruction to transform a modal double-faced card or to put one
//     onto the battlefield transformed.
//   [2021-02-05] Similarly, you don't have to control the Aura or Equipment that you choose as a
//     target of Halvar's triggered ability, but it must be attached to a creature you control.

const STATIC_TEXT = "Creatures you control that are enchanted or equipped have double strike.";
const ATTACH_TEXT =
  "At the beginning of each combat, you may attach target Aura or Equipment attached to a creature you control to target creature you control.";
const AURA_OR_EQUIPMENT = { anyOf: [{ subtype: "Aura" }, { subtype: "Equipment" }] } as const;

export default defineCard({
  name: "Halvar, God of Battle",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["God"],
  power: 4,
  toughness: 4,
  text: `${STATIC_TEXT}\n${ATTACH_TEXT}`,
  static: [
    {
      // Enchanted or equipped by anyone's Aura or Equipment (the rulings).
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", anyOf: [{ enchanted: true }, { equipped: true }] },
      },
      grantKeywords: ["double-strike"],
      text: STATIC_TEXT,
    },
  ],
  triggered: [
    {
      // Each combat, every player's turn.
      trigger: { on: "step-begins", step: "begin-combat", who: "any" },
      // The Aura or Equipment needn't be yours, only attached to a creature you
      // control (the rulings); Codsworth's attach-one-to-another shape.
      targets: [
        {
          kind: "permanent",
          filter: { ...AURA_OR_EQUIPMENT, attachedTo: { type: "creature", controlledBy: "you" } },
        },
        "creature-you-control",
      ],
      effect: {
        kind: "may",
        prompt: "Attach the targeted Aura or Equipment to the targeted creature?",
        effect: { kind: "attach", target: 1, attachment: 0 },
      },
      resolve: null,
      text: ATTACH_TEXT,
    },
  ],
  faces: ["Halvar, God of Battle", "Sword of the Realms"],
});
