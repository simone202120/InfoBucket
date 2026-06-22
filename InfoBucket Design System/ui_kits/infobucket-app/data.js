/* InfoBucket — mock catalogue for the UI kit. Plain global (window.IB_DATA). */
window.IB_DATA = {
  buckets: [
    { id: 'ml',      name: 'Machine learning', description: 'Papers and explainers I actually want to finish, not just bookmark.', count: 24, sources: ['article','document','video'] },
    { id: 'recipes', name: 'Recipes',          description: 'Weeknight-fast, mostly one-pan. Things I would actually cook.',       count: 11, sources: ['reel','article'] },
    { id: 'climate', name: 'Climate',          description: 'Long reads on energy, policy and the grid. The hopeful ones.',        count: 8,  sources: ['article','document'] },
    { id: 'design',  name: 'Design notes',     description: 'Interfaces, type and motion worth stealing from later.',              count: 17, sources: ['reel','video','article'] },
    { id: 'money',   name: 'Money',            description: 'Plain-language finance. Index funds, taxes, the boring wins.',        count: 6,  sources: ['article','document'] },
    { id: 'travel',  name: 'Japan trip',       description: 'Itineraries, neighbourhoods and a few places to eat in spring.',      count: 13, sources: ['reel','article','note'] },
  ],

  inbox: [
    {
      id: 'i1', source: 'article', sourceName: 'The Atlantic', status: 'ready',
      title: 'How transformers actually learn',
      summary: "Attention isn't memory — it's a learned routing of which earlier tokens matter for the next one. The piece reframes 'understanding' as repeated, cheap lookups rather than storage, which is why scale keeps helping.",
      tags: ['ml','to-read'], proposedBucket: { name: 'Machine learning' },
      url: 'theatlantic.com/transformers', note: '',
    },
    {
      id: 'i2', source: 'video', sourceName: 'Veritasium', status: 'processing',
      title: '', summary: '', tags: [], proposedBucket: null,
      url: 'youtube.com/watch?v=abc', note: '',
    },
    {
      id: 'i3', source: 'reel', sourceName: '@weeknightcooks', status: 'expiring', daysLeft: 3,
      title: 'Brown butter is the whole trick',
      summary: 'Brown the butter first, then bloom the spices in it — the order is the point. Fifteen seconds of patience changes the base flavour of everything that comes after.',
      tags: ['cooking'], proposedBucket: { name: 'Recipes', isNew: true },
      url: 'instagram.com/reel/xyz', note: 'Try with the lentil thing.',
    },
    {
      id: 'i4', source: 'document', sourceName: 'grid-report.pdf', status: 'ready',
      title: 'The grid is the bottleneck',
      summary: 'Interconnection queues, not generation, now gate clean-energy buildout. The report argues permitting reform beats new subsidies for the next decade of decarbonisation.',
      tags: ['energy','policy'], proposedBucket: { name: 'Climate' },
      url: 'files/grid-report.pdf', note: '',
    },
    {
      id: 'i5', source: 'article', sourceName: 'A List Apart', status: 'expiring', daysLeft: 6,
      title: 'Designing calm software',
      summary: 'Calm tools ask for attention only when they have earned it. A short manifesto for interfaces that sit in the periphery and step forward exactly once, with the right thing.',
      tags: ['design','ux'], proposedBucket: { name: 'Design notes' },
      url: 'alistapart.com/calm', note: '',
    },
  ],

  bucketItems: {
    ml: [
      { id: 'm1', source: 'document', sourceName: 'arXiv', status: 'saved', title: 'Attention is all you need',
        summary: 'The original transformer paper. Self-attention replaces recurrence; positions are encoded, not remembered.', tags: ['foundational'] },
      { id: 'm2', source: 'article', sourceName: 'Distill', status: 'saved', title: 'A visual intro to attention',
        summary: 'Interactive diagrams that make query-key-value click. Best first read before the paper above.', tags: ['intro','visual'] },
      { id: 'm3', source: 'video', sourceName: '3Blue1Brown', status: 'saved', title: 'But what is a GPT?',
        summary: 'Geometric intuition for embeddings and the logit lens. Worth the full 27 minutes.', tags: ['intro'] },
    ],
  },

  archive: [
    { id: 'a1', source: 'article', sourceName: 'Wired', status: 'archived', daysLeft: 12,
      title: 'The quiet death of the RSS reader',
      summary: 'A nostalgic but clear-eyed look at why chronological feeds lost, and what we gave up when they did.',
      tags: ['internet'] },
    { id: 'a2', source: 'reel', sourceName: '@studiokoto', status: 'archived', daysLeft: 4,
      title: 'One-line kerning fix',
      summary: 'A fifteen-second trick for optical spacing in display type. Saved it, never sorted it.',
      tags: ['type'] },
    { id: 'a3', source: 'video', sourceName: 'Kurzgesagt', status: 'archived', daysLeft: 18,
      title: 'How big is the universe, really?',
      summary: 'A calm scale tour from the observable edge inward. Pretty, but I never made time.',
      tags: ['science'] },
  ],

  searchResults: [
    { id: 's1', source: 'document', sourceName: 'arXiv', status: 'saved', bucket: 'Machine learning', match: 0.96,
      title: 'Attention is all you need',
      summary: 'Self-attention replaces recurrence; the model routes information between tokens directly.', tags: ['foundational'] },
    { id: 's2', source: 'article', sourceName: 'The Atlantic', status: 'ready', bucket: null, match: 0.88,
      title: 'How transformers actually learn',
      summary: "Attention is a learned routing of which earlier tokens matter — understanding as cheap, repeated lookups.", tags: ['ml'] },
    { id: 's3', source: 'video', sourceName: '3Blue1Brown', status: 'saved', bucket: 'Machine learning', match: 0.81,
      title: 'But what is a GPT?',
      summary: 'Geometric intuition for embeddings and attention, built up from dot products.', tags: ['intro'] },
  ],
};
