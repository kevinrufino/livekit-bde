/**
 * Copy for the Séance launch page. Use as much or as little as you like — and feel
 * free to edit it if a design calls for shorter lines.
 */
export const launch = {
  eyebrow: 'Introducing Séance 1.0',
  headline: 'Realtime voice for the afterlife',
  subhead:
    'DeadKit is the open-source platform for building voice agents that talk to the departed. Sub-100ms latency, even across the veil.',
  primaryCta: { label: 'Start haunting', href: '#intake' },
  secondaryCta: { label: 'Read the docs', href: '#' },

  features: [
    {
      title: 'Ectoplasmic transport',
      body: 'WebRTC tuned for spectral networks. Packets arrive before they were sent.',
    },
    {
      title: 'Turn detection',
      body: 'Knows when a spirit has finished speaking — or is merely rattling chains.',
    },
    {
      title: 'Global edge',
      body: 'Points of presence in 13 cemeteries worldwide, with more rising every night.',
    },
  ],

  stats: [
    { value: '13ms', label: 'Median latency to the beyond' },
    { value: '666', label: 'Concurrent séances per room' },
    { value: '∞', label: 'Uptime (we never really go down)' },
  ],

  intake: {
    eyebrow: 'Early access',
    headline: 'Book your first séance',
    body: "Tell us a little about you and what you're building. We read every intake, usually before the candles burn down.",
    steps: [
      'Tell us who you are and who you want to reach.',
      'A DeadKit medium replies within one business day.',
      'You get sandbox keys and start haunting.',
    ],

    // One question per step, in order.
    fields: {
      name: { question: 'First, what should we call you?', placeholder: 'Vincent Price' },
      email: {
        question: 'Where can a medium reach you?',
        placeholder: 'vincent@hauntedhill.com',
        hint: "Your work email. We'll only use it to reply to you.",
      },
      company: { question: 'Which company are you with?', placeholder: 'Haunted Hill Labs' },
      industry: { question: 'What industry are you in?' },
      referral: {
        question: 'How did you hear about Séance?',
        placeholder: 'A podcast, a colleague, a whisper in the walls…',
      },
      useCase: {
        question: 'What will your agent do?',
        placeholder: 'Who should it talk to, and what should it say?',
        hint: 'Optional, but the more specific, the better we can prepare.',
      },
    },

    // Alphabetical, with "Other" last.
    industries: [
      { value: 'customer-support', label: 'Customer support' },
      { value: 'developer-tools', label: 'Developer tools' },
      { value: 'education', label: 'Education' },
      { value: 'financial-services', label: 'Financial services' },
      { value: 'funeral-memorial', label: 'Funeral & memorial services' },
      { value: 'gaming', label: 'Gaming' },
      { value: 'healthcare', label: 'Healthcare' },
      { value: 'media-entertainment', label: 'Media & entertainment' },
      { value: 'paranormal-research', label: 'Paranormal research' },
      { value: 'retail-ecommerce', label: 'Retail & e-commerce' },
      { value: 'other', label: 'Other' },
    ],

    controls: {
      back: 'Back',
      next: 'Continue',
      enter: 'Enter ↵',
      enterMultiline: 'Ctrl/⌘ + Enter',
      step: (n: number, total: number) => `Question ${n} of ${total}`,
    },
    submitLabel: 'Request a séance',
    pendingLabel: 'Summoning…',
    success: {
      headline: 'The circle is drawn.',
      body: 'A DeadKit medium will reach out within one business day.',
      again: 'Submit another response',
    },
  },
} as const;
