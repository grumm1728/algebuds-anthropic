import type { Chat, Config } from './types'

export const DEFAULT_CONFIG: Config = {
  userName: 'Explorer',
  thinkingDelay: 900,
  streamSpeed: 8,
}

export const CANNED_RESPONSE =
  "This is a scaffolded response. The real Claude API isn't wired up yet — this text is just streaming in to demonstrate the thinking spark and the message flow.\n\nYou can replace this with a real API call, or edit the seeded chats in the source to prototype different conversation shapes."

export const SEED_CHATS: Chat[] = [
  {
    id: 'c1',
    title: 'Naming my sourdough starter',
    messages: [
      {
        role: 'user',
        content: "I need a name for my sourdough starter. It's very bubbly and slightly judgmental.",
      },
      {
        role: 'assistant',
        content:
          "A judgmental starter deserves a name with gravitas. Some options:\n\n**The Classics**\nBread Pitt. Clint Yeastwood. Dough Malone.\n\n**The Aristocrats**\nLord Crumbsworth. The Dowager Loafess. Sir Rises-a-Lot.\n\n**The Unhinged**\nGluten Tag. The Thing in the Jar. Kevin.\n\nGiven the bubbly-yet-judgmental energy, I'd lean toward **The Dowager Loafess**. She's seen things. She has opinions about your feeding schedule. She will outlive you.",
      },
    ],
  },
  {
    id: 'c2',
    title: 'Convince my cat to respect me',
    messages: [
      {
        role: 'user',
        content: 'How do I convince my cat that I am, in fact, the one in charge here?',
      },
      {
        role: 'assistant',
        content:
          "I admire the ambition, but I should be honest with you: you are not going to win this one.\n\n**What you can try**\nControl the food. Be the sole dispenser of treats. Establish a routine so ironclad that the cat associates your presence with reliable comfort rather than chaos.\n\n**What will actually happen**\nThe cat will accept the food, interpret the routine as the bare minimum expected of a servant, and continue to knock things off tables while maintaining direct eye contact.\n\n**The healthy reframe**\nYou are not in charge. You are a beloved and well-compensated employee. The benefits are excellent (warmth, purring, the occasional dead moth as a bonus). Lean into it.",
      },
    ],
  },
]
