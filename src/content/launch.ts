/**
 * Copy for the Séance launch page. Use as much or as little as you like — and feel
 * free to edit it if a design calls for shorter lines.
 */
export const launch = {
  eyebrow: 'Introducing Séance 1.0',
  headline: 'Realtime voice for the afterlife',
  subhead:
    'DeadKit is the open-source platform for building voice agents that talk to the departed. Sub-100ms latency, even across the veil.',
  primaryCta: { label: 'Start haunting', href: '#' },
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
} as const;
