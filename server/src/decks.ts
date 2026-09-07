/**
 * The starter decks a new room is seeded with — up to four seats, sliced
 * down to however many players a room asks for.
 *
 * These are deliberately *not* format-legal: each is a ~60-card "good stuff"
 * pile that shows off a broad slice of the implemented card pool (alt-cast
 * zones, cascade / storm, extra turns, planeswalkers, replacements, tutors,
 * board wipes, man-lands, copy effects, …) so a fresh room is fun to poke at.
 * Colour identity is ignored — Command Tower / Chromatic Lantern / mana rocks /
 * Evolving Wilds keep the splashes castable. Swap in a real decklist via the
 * `/import-deck` audit + a hand-built list when you want legality.
 */

import { asPlayerId } from "engine";
import type { PlayerId } from "engine";

export const ALICE: PlayerId = asPlayerId("alice");
export const BOB: PlayerId = asPlayerId("bob");
export const CAROL: PlayerId = asPlayerId("carol");
export const DAVE: PlayerId = asPlayerId("dave");

const list = (entries: readonly (readonly [string, number])[]): string[] =>
  entries.flatMap(([name, count]) => Array<string>(count).fill(name));

export interface SeatDeck {
  readonly id: PlayerId;
  readonly cards: readonly string[];
  /** No commander configured means a plain (non-Commander) 40-card deck. */
  readonly commander?: string;
}

/** Every seat a room could have, in seating order — sliced to however many
 * players were asked for (2-4). */
export const SEATS: readonly SeatDeck[] = [
  {
    // Ramp into fat threats — cascade, extra turns, an anthem of tokens, and
    // Ureni's big ETB payoff.
    id: ALICE,
    commander: "Ureni of the Unwritten",
    cards: list([
      ["Forest", 9],
      ["Island", 3],
      ["Mountain", 3],
      ["Command Tower", 1],
      ["Evolving Wilds", 2],
      ["Rogue's Passage", 1],
      ["Mishra's Factory", 1],
      ["Tranquil Thicket", 1],
      ["Llanowar Elves", 2],
      ["Rampant Growth", 2],
      ["Sol Ring", 1],
      ["Arcane Signet", 1],
      ["Chromatic Lantern", 1],
      ["Cryptolith Rite", 1],
      ["Elvish Visionary", 2],
      ["Grizzly Bears", 1],
      ["Rumbling Baloth", 1],
      ["Craw Wurm", 1],
      ["Giant Spider", 1],
      ["Oracle of Mul Daya", 1],
      ["Rampaging Baloths", 1],
      ["Wurmcoil Engine", 1],
      ["Bloodbraid Elf", 1],
      ["Wilt-Leaf Cavaliers", 1],
      ["Prosperous Innkeeper", 1],
      ["Combat Thresher", 1],
      ["Snapcaster Mage", 1],
      ["Clone", 1],
      ["Mossback Dragon", 1],
      ["Garruk Wildspeaker", 1],
      ["Giant Growth", 2],
      ["Prey Upon", 1],
      ["Rabid Bite", 1],
      ["Naturalize", 1],
      ["Fog", 1],
      ["Doubling Season", 1],
      ["Glorious Anthem", 1],
      ["Aggravated Assault", 1],
      ["Time Warp", 1],
      ["Twincast", 1],
      ["Turn to Frog", 1],
      ["Demonic Tutor", 1],
      ["Explorer's Insight", 1],
      ["Contentious Plan", 1],
    ]),
  },
  {
    // Mardu aggro + a full burn suite — suspend, storm, flashback, edicts,
    // steal-your-guy, and Chandra to close.
    id: BOB,
    commander: "Ashmark, Mardu Vanguard",
    cards: list([
      ["Mountain", 9],
      ["Plains", 4],
      ["Swamp", 4],
      ["Command Tower", 1],
      ["Evolving Wilds", 2],
      ["Sol Ring", 1],
      ["Arcane Signet", 1],
      ["Raging Goblin", 1],
      ["Goblin Raider", 2],
      ["Monastery Swiftspear", 1],
      ["Boggart Brute", 1],
      ["White Knight", 2],
      ["Hill Giant", 1],
      ["Vampire Nighthawk", 2],
      ["Serra Angel", 1],
      ["Bloodthrone Vampire", 1],
      ["Fleshbag Marauder", 1],
      ["Juggernaut", 1],
      ["Thalia, Guardian of Thraben", 1],
      ["Hypnotic Specter", 1],
      ["Underworld Rage-Hound", 1],
      ["Chandra, Acolyte of Flame", 1],
      ["Lightning Bolt", 3],
      ["Rift Bolt", 1],
      ["Flame Javelin", 1],
      ["Fireball", 1],
      ["Blaze", 1],
      ["Volt Charge", 1],
      ["Gut Shot", 1],
      ["Blightning", 1],
      ["Grapeshot", 1],
      ["Faithless Looting", 1],
      ["Diabolic Edict", 1],
      ["Doom Blade", 1],
      ["Pyroclasm", 1],
      ["Disenchant", 1],
      ["Threaten", 1],
      ["Act of Treason", 1],
      ["Raise the Alarm", 1],
    ]),
  },
  {
    // Dimir tempo/control — counters, bounce, foretell, mill, a Twincast, and
    // graveyard-fed fatties for Sarova's recursion.
    id: CAROL,
    commander: "Sarova, the Undying Current",
    cards: list([
      ["Island", 9],
      ["Swamp", 8],
      ["Command Tower", 1],
      ["Evolving Wilds", 2],
      ["Sol Ring", 1],
      ["Arcane Signet", 1],
      ["Prodigal Sorcerer", 2],
      ["Typhoid Rats", 2],
      ["Vengeful Ghoul", 1],
      ["Vampire Nighthawk", 2],
      ["Thieving Magpie", 2],
      ["Snapcaster Mage", 1],
      ["Man-o'-War", 1],
      ["Invisible Stalker", 1],
      ["Mortivore", 1],
      ["Lord of Extinction", 1],
      ["Clone", 1],
      ["Counterspell", 2],
      ["Negate", 1],
      ["Essence Scatter", 1],
      ["Unsummon", 1],
      ["Boomerang", 1],
      ["Mind Rot", 1],
      ["Mind Control", 1],
      ["Turn to Frog", 1],
      ["Doom Blade", 1],
      ["Twincast", 1],
      ["Opt", 2],
      ["Preordain", 1],
      ["Consider", 1],
      ["Behold the Multiverse", 1],
      ["Contentious Plan", 1],
      ["Phyrexian Arena", 1],
      ["Greed", 1],
      ["Explorer's Insight", 1],
      ["Tome Scour", 1],
      ["Levitation", 1],
      ["Jump", 1],
    ]),
  },
  // Selesnya go-wide — anthems, tokens, lifegain, a board wipe, graveyard
  // hate — anchored by Seraphine.
  {
    id: DAVE,
    commander: "Seraphine, Dawnherald",
    cards: list([
      ["Plains", 9],
      ["Forest", 7],
      ["Swamp", 2],
      ["Command Tower", 1],
      ["Evolving Wilds", 2],
      ["Sol Ring", 1],
      ["Arcane Signet", 1],
      ["Grizzly Bears", 1],
      ["White Knight", 2],
      ["Fencing Ace", 2],
      ["Gladecover Scout", 1],
      ["Wall of Wood", 1],
      ["Wildwood Sentinel", 1],
      ["Giant Spider", 1],
      ["Serra Angel", 2],
      ["Soul Warden", 1],
      ["Ajani's Pridemate", 1],
      ["Zulaport Cutthroat", 1],
      ["Prosperous Innkeeper", 1],
      ["Combat Thresher", 1],
      ["Foundry Inspector", 1],
      ["Darksteel Myr", 1],
      ["Walking Ballista", 1],
      ["Raise the Alarm", 2],
      ["Glorious Anthem", 1],
      ["Bonesplitter", 1],
      ["Holy Strength", 1],
      ["Pacifism", 2],
      ["Wrath of God", 1],
      ["Angelic Edict", 1],
      ["Disenchant", 1],
      ["Demonic Tutor", 1],
      ["Rest in Peace", 1],
      ["Grave Pact", 1],
      ["Naturalize", 1],
      ["Deliberate Course", 1],
    ]),
  },
];

/** Alice's and Bob's commanders/decks addressed by name, for tests that
 * construct a `Game` directly rather than going through a room. */
export const COMMANDERS: { readonly alice: string; readonly bob: string } = {
  alice: SEATS[0].commander as string,
  bob: SEATS[1].commander as string,
};

export const DECKS: {
  readonly alice: readonly string[];
  readonly bob: readonly string[];
} = {
  alice: SEATS[0].cards,
  bob: SEATS[1].cards,
};
