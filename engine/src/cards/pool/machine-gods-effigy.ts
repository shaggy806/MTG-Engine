import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 2902.
//
// Rulings:
//   [2022-10-14] If Machine God’s Effigy copies a land with a basic land type that has become a
//     creature due to an effect, it will not have any mana abilities that land had due to its land
//     types (it will have the one it gives itself, though). For example, if a basic Forest became
//     a creature due to some effect, and Machine God’s Effigy entered the battlefield as a copy of
//     it, it would be a basic artifact named Forest and have “{T}: Add {U},” but not the intrinsic
//     ability “{T}: Add {G}.”
//   [2022-10-14] If Machine God’s Effigy copies a planeswalker that became a creature due to an
//     effect, Machine God’s Effigy will have that planeswalker’s loyalty abilities but its only
//     card type is artifact (it will still be legendary in most cases). Because it isn’t a
//     planeswalker itself, it won’t enter the battlefield with any loyalty counters, but it also
//     won’t die because due to not having any. Similarly, it can’t be attacked and damage can’t be
//     dealt to it. You may activate only one loyalty ability of that permanent per turn. If it
//     later becomes a creature and damage is dealt to it, that damage won’t remove any loyalty
//     counters.
//   [2022-10-14] If Machine God’s Effigy somehow enters the battlefield at the same time as
//     another creature, it can’t become a copy of that creature. You may choose only a creature
//     that’s already on the battlefield.
//   [2022-10-14] If the chosen creature is a token, Machine God’s Effigy copies the original
//     characteristics of that token as stated by the effect that created the token, plus the
//     listed exceptions. Machine God’s Effigy is not a token, even when copying one.
//   [2022-10-14] Except for its types and non-artifact subtypes, Machine God’s Effigy copies
//     exactly what was printed on the original creature and nothing more (unless that creature is
//     copying something else or is a token; see below), and it will have “{T}:Add {U}.” It doesn’t
//     copy whether that creature is tapped or untapped, whether it has any counters on it or Auras
//     attached to it, or any non-copy effects that have changed its types, color, and so on.
//   [2022-10-14] If the copied creature has {X} in its mana cost, X is 0.
//   [2022-10-14] If the chosen creature is copying something else, then Machine God’s Effigy
//     enters the battlefield as whatever the chosen creature is copying (with the listed
//     exceptions).
//   [2022-10-14] The ability of Machine God’s Effigy doesn’t target the creature.
//   [2022-10-14] Any enters-the-battlefield abilities of the copied creature will trigger when
//     Machine God’s Effigy enters the battlefield. Any “as [this creature] enters the battlefield”
//     or “[this creature] enters the battlefield with” abilities of the chosen creature will also
//     work. Note that some of these effects may function correctly only if it is a creature, and
//     will not do anything productive since the copy is an artifact, not a creature.
//   [2022-10-14] If Machine God’s Effigy copies a Saga that has become a creature due to an
//     effect, it will have that Saga’s chapter abilities, but it won’t get a lore counter every
//     turn because it isn’t itself a Saga since its only card type is artifact. Unless it has the
//     read ahead ability found on some Saga cards in the Dominaria United set, it also won’t enter
//     the battlefield with any counters. If you do find a way to put lore counters on it, the
//     appropriate ability or abilities will trigger. It will not be sacrificed after it has lore
//     counters equal to its final chapter number.
//   [2022-10-14] Machine God’s Effigy will not copy any types (such as creature or enchantment) or
//     non-artifact subtypes (such as Phyrexian or Elf) that creature had, but it will copy any
//     supertypes, such as legendary, and artifact subtypes (such as Treasure or Vehicle). It also
//     has the same name, so if you copy a legendary creature you control, you will need to choose
//     one of them to put in your graveyard due to the legend rule.

// `setTypes: ["artifact"]` is "except it's an artifact": it loses every other card type
// and the subtypes that went with them, keeping its supertypes and any artifact subtype
// (rule 205.1a — the rulings), and the copy has "{T}: Add {U}." as a copiable value.
const MANA = addManaAbility({ mana: "U", text: "{T}: Add {U}." });

export default defineCard({
  name: "Machine God's Effigy",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "You may have this artifact enter as a copy of any creature on the battlefield, except it's an artifact and it has \"{T}: Add {U}.\" (It's not a creature.)\n{T}: Add {U}.",
  copyOnEnter: {
    filter: { type: "creature" },
    except: { setTypes: ["artifact"], activated: [MANA] },
  },
  activated: [MANA],
});
