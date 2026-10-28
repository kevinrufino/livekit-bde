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

    fields: {
      name: { label: 'Name', placeholder: 'Vincent Price' },
      email: { label: 'Work email', placeholder: 'vincent@hauntedhill.com' },
      company: { label: 'Company', placeholder: 'Haunted Hill Labs' },
      industry: { label: 'Industry', placeholder: 'Select an industry' },
      referral: {
        label: 'How did you hear about us?',
        placeholder: 'A podcast, a colleague, a whisper in the walls…',
      },
      useCase: {
        label: 'How are you planning to use Séance?',
        placeholder: 'Who should your agent talk to, and what should it say?',
        hint: 'The more specific, the better we can prepare.',
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

    privacyNote: "We'll only use this to reply to you.",
    submitLabel: 'Request a séance',
    pendingLabel: 'Summoning…',
    success: {
      headline: 'The circle is drawn.',
      body: 'A DeadKit medium will reach out within one business day.',
      again: 'Submit another response',
    },
  },
} as const;
