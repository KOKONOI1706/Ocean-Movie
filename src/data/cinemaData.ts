import { MediaItem, MoodCategory } from '../types';

export const MOOD_CATEGORIES: MoodCategory[] = [
  {
    id: 'restless',
    title: 'FOR THE RESTLESS',
    subtitle: 'HYPER-KINETIC TEMPOS & PSYCHIC FRICTION',
    manifesto: 'When the nervous system demands relentless momentum, non-linear architecture, and visceral friction.',
    accentQuote: '“Velocity without catharsis: the pure geometry of anxiety.”',
    mediaIds: ['blade-runner-2049', 'severance', 'the-last-signal', 'zone-of-interest']
  },
  {
    id: 'lonely',
    title: 'FOR THE LONELY',
    subtitle: 'VAST HORIZONS, QUIET ROOMS, DISTANT SIGNALS',
    manifesto: 'Solitude transformed into architecture. Films that understand the weight of an unanswered broadcast.',
    accentQuote: '“To exist across lightyears and still yearn for a human touch.”',
    mediaIds: ['after-yang', 'interstellar', 'stalker', 'perfect-days']
  },
  {
    id: 'curious',
    title: 'FOR THE CURIOUS',
    subtitle: 'ONTOLOGICAL PUZZLES & LABYRINTHINE CODICES',
    manifesto: 'Narratives engineered like clockwork riddles where every answer fractures into three further enigmas.',
    accentQuote: '“The question is not where, but when.”',
    mediaIds: ['dark', 'the-last-signal', 'severance', 'chronicle-metropolis']
  },
  {
    id: 'obsessed',
    title: 'FOR THE OBSESSED',
    subtitle: 'MONOMANIA, ANALOG RECORDINGS, REPETITION',
    manifesto: 'Portraits of minds gripped by single inescapable frequencies, endless rewinds, and doomed investigations.',
    accentQuote: '“We do not choose our fixations; they colonize our silence.”',
    mediaIds: ['stalker', 'zone-of-interest', 'dark', 'memory-archive-09']
  },
  {
    id: 'romantics',
    title: 'FOR THE ROMANTICS',
    subtitle: 'UNLIVED FUTURES & TENDER PARALLEL LIVES',
    manifesto: 'The bittersweet ache of in-yeon: strangers who brushed shoulders in eight thousand previous lifetimes.',
    accentQuote: '“If two people step on the same shadow, they were lovers once.”',
    mediaIds: ['past-lives', 'after-yang', 'perfect-days', 'interstellar']
  },
  {
    id: 'night-owls',
    title: 'FOR THE NIGHT OWLS',
    subtitle: '3:00 AM CATHODE GLOW & SHADOW STUDIES',
    manifesto: 'Hypnagogic works best projected against bare plaster walls while the city sleeps in heavy mist.',
    accentQuote: '“Midnight is not an hour; it is an alternate country.”',
    mediaIds: ['son-of-sun', 'chronicle-metropolis', 'blade-runner-2049', 'memory-archive-09']
  }
];

export const CINEMA_ITEMS: MediaItem[] = [
  {
    id: 'the-last-signal',
    title: 'THE LAST SIGNAL',
    originalTitle: 'LE DERNIER SIGNAL',
    tagline: 'An intercepted orbital transmission reveals an observer who refuses to leave.',
    year: 2026,
    type: 'ai_film',
    director: 'Elena Vance & Latent Lab',
    directorId: 'elena-vance',
    cast: ['Astrid Holm (voice)', 'Synthesized Ensemble'],
    genres: ['Sci-Fi', 'Psychological Drama', 'Experimental Short'],
    moods: ['restless', 'curious', 'night-owls'],
    runtime: '18 min',
    runtimeMinutes: 18,
    rating: 9.1,
    editorialQuote: '“A haunting, grain-drenched revelation that proves synthetic cinema can possess an aching, fragile soul.”',
    synopsis: 'Deep in the Kuiper belt, an automated communications array registers an anomalous harmonic loop. Stationed alone for eleven subjective months, audio archivist Lyra begins reconstructing fragments of a transmission that precedes human spaceflight by three centuries.',
    backdropUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=85',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=85',
    monochromePosterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=85&sat=-100',
    isCoverFeature: true,
    aiMatchScore: 98,
    whyYouMayLike: 'You seek brief, atmospheric cinema with pristine sound design, existential isolation, and high visual restraint.',
    aiMattersAnalysis: {
      themes: 'Temporal entropy, synthetic memory, automated loneliness, electromagnetic haunting.',
      mood: 'Hypnotic, austere, melancholic, reverent.',
      visualStyle: 'Monochromatic 70mm grain emulation, anamorphic flares, brutalist observatory architecture, stark shadow play.',
      narrativeStyle: 'Epistolary audio fragments paired with slow meditative tracking shots.',
      emotionalIntensity: 'High — Subtle Existential Dread and Poetic Ache.',
      audienceFit: 'Connoisseurs of Tarkovsky, Chris Marker (La Jetée), and early Jóhann Jóhannsson scores.'
    },
    aiInvolvement: {
      isAiFilm: true,
      toolsUsed: ['Sora AI 2.0', 'Midjourney v6.1 Anamorphic', 'Runway Gen-3 Alpha', 'ElevenLabs Spatial Resynthesis', 'Claude 3.7 Sonnet (Screenplay)'],
      promptDirector: 'Elena Vance',
      workflowNotes: 'Prompt-directed generative plates merged with analog 35mm optical printer grain pass and spatial tape-decay sound design.'
    },
    streamingOptions: [
      {
        provider: 'Official Vimeo On Demand',
        type: 'free',
        region: 'Global',
        url: 'https://vimeo.com',
        badge: 'Stream Free'
      },
      {
        provider: 'MUBI Cult Lab',
        type: 'subscription',
        region: 'US / UK / EU',
        url: 'https://mubi.com',
        badge: 'Available on MUBI'
      },
      {
        provider: 'YouTube 4K Premiere',
        type: 'free',
        region: 'Global',
        url: 'https://youtube.com',
        badge: 'Watch on YouTube'
      }
    ],
    subtitlesAvailable: [
      {
        language: 'English',
        isAiAssisted: false,
        sampleDialogue: {
          original: '“The stars are not silent; we simply stopped listening in analog.”',
          translated: '“The stars are not silent; we simply stopped listening in analog.”'
        }
      },
      {
        language: 'French',
        isAiAssisted: true,
        sampleDialogue: {
          original: '“The stars are not silent; we simply stopped listening in analog.”',
          translated: '« Les étoiles ne sont pas silencieuses ; nous avons simplement cessé d’écouter en analogique. »'
        }
      },
      {
        language: 'Japanese',
        isAiAssisted: true,
        sampleDialogue: {
          original: '“The stars are not silent; we simply stopped listening in analog.”',
          translated: '「星々は沈黙していない。私たちがアナログで聴くのをやめただけだ。」'
        }
      },
      {
        language: 'Vietnamese',
        isAiAssisted: true,
        sampleDialogue: {
          original: '“The stars are not silent; we simply stopped listening in analog.”',
          translated: '“Những vì sao không hề im lặng; chỉ là chúng ta đã ngừng lắng nghe theo cách tương tự.”'
        }
      }
    ]
  },
  {
    id: 'dark',
    title: 'DARK',
    originalTitle: 'DARK',
    tagline: 'The question is not where, but when.',
    year: 2017,
    type: 'series',
    director: 'Baran bo Odar & Jantje Friese',
    directorId: 'baran-bo-odar',
    cast: ['Louis Hofmann', 'Oliver Masucci', 'Karoline Eichhorn', 'Maja Schöne'],
    genres: ['Sci-Fi', 'Mystery', 'Family Saga', 'Existential Drama'],
    moods: ['curious', 'obsessed', 'night-owls'],
    runtime: '3 Seasons',
    runtimeMinutes: 1560,
    rating: 9.4,
    editorialQuote: '“The most mathematically rigorous and emotionally devastating exploration of determinism ever committed to television.”',
    synopsis: 'When two children vanish in the shadowy German forest town of Winden, four fractured families begin a labyrinthine investigation that unearths a temporal knot spanning three interconnected 33-year cycles.',
    backdropUrl: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=1920&q=85',
    posterUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=85',
    monochromePosterUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=85&sat=-100',
    aiMatchScore: 97,
    whyYouMayLike: 'You relish intricate temporal paradoxes, moody rain-soaked cinematography, and stories where free will is a tragic illusion.',
    aiMattersAnalysis: {
      themes: 'Eternal recurrence, causal loops, grief as a catalyst for catastrophe, generational trauma.',
      mood: 'Ominous, suffocatingly atmospheric, melancholic, grand.',
      visualStyle: 'Dual-tone yellow rain slickers against desaturated pine woods, symmetrical split-screen framing, brutalist concrete nuclear towers.',
      narrativeStyle: 'Multi-threaded chronological puzzle with strict internal physics.',
      emotionalIntensity: 'Extreme — Relentless Psychological Weight.',
      audienceFit: 'Fans of Primer, 12 Monkeys, Twin Peaks, and Greek tragic theater.'
    },
    streamingOptions: [
      {
        provider: 'Netflix',
        type: 'subscription',
        region: 'Global',
        url: 'https://netflix.com',
        badge: 'Available on Netflix'
      },
      {
        provider: 'Apple TV',
        type: 'buy',
        price: '$19.99/Season',
        region: 'US / UK',
        url: 'https://tv.apple.com',
        badge: 'Buy on Apple TV'
      }
    ],
    seasons: [
      {
        seasonNumber: 1,
        title: 'Cycle 1: The Disappearances',
        year: 2017,
        episodeCount: 10,
        episodes: [
          {
            id: 'dark-s01e01',
            seasonNumber: 1,
            episodeNumber: 1,
            title: 'Secrets (Geheimnisse)',
            runtime: '51 min',
            airDate: 'Dec 1, 2017',
            thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
            synopsis: 'In 2019, the disappearance of a local boy sparks fear in the residents of Winden, a small German town with a strange and tragic history.',
            aiRecap: 'Mikkel Nielsen vanishes near the Winden caves during a midnight excursion. Jonas Kahnwald returns to school following his father Michael’s suicide note which is sealed until Nov 4, 10:13 PM.',
            keyCharacters: ['Jonas Kahnwald', 'Ulrich Nielsen', 'Charlotte Doppler', 'The Stranger'],
            majorThemes: ['Paternal grief', 'Concealed village guilt', 'Temporal rupture'],
            emotionalTone: 'Bleak, heavy, foreshadowing.',
            importantEvents: ['Erik Obendorf search yields nothing', 'Mikkel enters cave passage', '1986 dead boy with burned eyes is found'],
            beforeYouWatchNote: 'Take note of the family portraits hanging in the Kahnwald foyer and the date on the suicide letter.',
            playbackProgress: 100
          },
          {
            id: 'dark-s01e02',
            seasonNumber: 1,
            episodeNumber: 2,
            title: 'Lies (Lügen)',
            runtime: '45 min',
            airDate: 'Dec 1, 2017',
            thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
            synopsis: 'When a grim discovery confounds police, Ulrich seeks a search warrant for the power plant. A mysterious stranger checks into the hotel.',
            aiRecap: 'Ulrich suspects Doppler and Tiedemann are concealing something inside the nuclear facility perimeter. Jonas discovers a hand-drawn map hidden in his father’s attic studio.',
            keyCharacters: ['Ulrich Nielsen', 'Regina Tiedemann', 'The Stranger'],
            majorThemes: ['Deceit among neighbours', 'Class fractures in small towns'],
            emotionalTone: 'Tense, analytical, paranoid.',
            importantEvents: ['Dead boy autopsy reveals 1980s currency and Walkman', 'The Stranger enters the town hotel'],
            beforeYouWatchNote: 'Listen closely to the audio ticking motif every time a clock appears on screen.',
            playbackProgress: 100
          },
          {
            id: 'dark-s01e03',
            seasonNumber: 1,
            episodeNumber: 3,
            title: 'Past and Present (Gestern und Heute)',
            runtime: '57 min',
            airDate: 'Dec 1, 2017',
            thumbnail: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=600&q=80',
            synopsis: 'It is 1986, and Ulrich’s brother Mads has been missing for a month. Confusion reigns as past and present intertwine.',
            aiRecap: 'The timeline shifts 33 years prior to 1986. Young Ulrich Nielsen rebels against police while young Charlotte collects dead birds dropping from the sky.',
            keyCharacters: ['Young Ulrich', 'Young Katharina', 'Egon Tiedemann', 'Young Claudia'],
            majorThemes: ['The persistence of character flaws across decades', 'Pre-Chernobyl anxiety'],
            emotionalTone: 'Nostalgic yet dread-inducing.',
            importantEvents: ['Mikkel awakens in 1986 and meets young Ines Kahnwald at the hospital'],
            beforeYouWatchNote: 'Pay attention to the song playing on Mads’ cassette player.',
            playbackProgress: 100
          },
          {
            id: 'dark-s01e04',
            seasonNumber: 1,
            episodeNumber: 4,
            title: 'Double Lives (Doppelleben)',
            runtime: '47 min',
            airDate: 'Dec 1, 2017',
            thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
            synopsis: 'Bizarre occurrences spark a sense of déjà vu. Charlotte suspects Peter is hiding something.',
            aiRecap: 'Charlotte tracks Peter Doppler’s car movements on the night of Mikkel’s disappearance. Franziska Doppler sells hormone pills near the railway.',
            keyCharacters: ['Charlotte Doppler', 'Peter Doppler', 'Elisabeth Doppler'],
            majorThemes: ['Marital estrangement', 'Secret shame'],
            emotionalTone: 'Cold, forensic, fractured.',
            importantEvents: ['Elisabeth meets the mute Noah in the woods', 'Dead sheep found with ruptured eardrums'],
            beforeYouWatchNote: 'Notice the watch on Noah’s wrist.',
            playbackProgress: 67
          }
        ]
      },
      {
        seasonNumber: 2,
        title: 'Cycle 2: The God Particle',
        year: 2019,
        episodeCount: 8,
        episodes: [
          {
            id: 'dark-s02e01',
            seasonNumber: 2,
            episodeNumber: 1,
            title: 'Beginnings and Endings',
            runtime: '54 min',
            airDate: 'Jun 21, 2019',
            thumbnail: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=600&q=80',
            synopsis: 'Six days before the apocalypse, Clausen arrives in Winden to lead the missing persons task force as Jonas searches for the dark matter portal in 2053.',
            aiRecap: 'Jonas survives in the post-apocalyptic nuclear wasteland of 2053 under the ruthless watch of an older Elisabeth Doppler.',
            keyCharacters: ['Future Jonas', 'Inspector Clausen', 'Noah', 'Adam'],
            majorThemes: ['Eschatology', 'The impossibility of altering predetermined fate'],
            emotionalTone: 'Monumental, apocalyptic, solemn.',
            importantEvents: ['Discovery of the God Particle suspension ring', 'Introduction of Adam inside Sic Mundus sanctuary'],
            beforeYouWatchNote: 'Remember that Adam’s facial scarring is attributed to prolonged radioactive exposure from time travel.',
            playbackProgress: 0
          }
        ]
      }
    ],
    subtitlesAvailable: [
      {
        language: 'German (Original)',
        isAiAssisted: false,
        sampleDialogue: {
          original: '“Der Unterschied zwischen Vergangenheit, Gegenwart und Zukunft ist nur eine Illusion.”',
          translated: '“The distinction between past, present and future is only a stubbornly persistent illusion.”'
        }
      },
      {
        language: 'English',
        isAiAssisted: false,
        sampleDialogue: {
          original: '“The distinction between past, present and future is only an illusion.”',
          translated: '“The distinction between past, present and future is only an illusion.”'
        }
      },
      {
        language: 'Vietnamese',
        isAiAssisted: true,
        sampleDialogue: {
          original: '“Der Unterschied zwischen Vergangenheit, Gegenwart und Zukunft ist nur eine Illusion.”',
          translated: '“Sự khác biệt giữa quá khứ, hiện tại và tương lai chỉ là một ảo ảnh ngoan cố.”'
        }
      }
    ]
  },
  {
    id: 'interstellar',
    title: 'INTERSTELLAR',
    originalTitle: 'INTERSTELLAR',
    tagline: 'Mankind was born on Earth. It was never meant to die here.',
    year: 2014,
    type: 'movie',
    director: 'Christopher Nolan',
    directorId: 'christopher-nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
    genres: ['Sci-Fi', 'Drama', 'Adventure'],
    moods: ['lonely', 'romantics', 'curious'],
    runtime: '169 min',
    runtimeMinutes: 169,
    rating: 8.7,
    editorialQuote: '“An audacious synthesis of Einsteinian relativity and naked human grief, anchored by Hans Zimmer’s cathedral organ.”',
    synopsis: 'As an agricultural blight turns Earth into a dying dust bowl, a team of astrophysicists and former pilots embark on a voyage through a wormhole near Saturn in search of a habitable sanctuary across the stars.',
    backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=85',
    posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=85',
    monochromePosterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=85&sat=-100',
    aiMatchScore: 95,
    whyYouMayLike: 'You crave grand scale cosmic ambition grounded in the primal tragedy of parents outliving their children through the cruelty of time dilation.',
    aiMattersAnalysis: {
      themes: 'Love as a physical dimension, gravitational mechanics, human survival imperatives, the silence of deep space.',
      mood: 'Monumental, aching, urgent, awe-inspiring.',
      visualStyle: 'Practical IMAX miniatures, authentic Kip Thorne black hole physics, wide barren planetary vistas.',
      narrativeStyle: 'Epic classical journey interspersed with intimate cross-generational video messages.',
      emotionalIntensity: 'Very High — Devastating familial sentiment.',
      audienceFit: 'Viewers drawn to 2001: A Space Odyssey, Contact, and Solaris.'
    },
    streamingOptions: [
      {
        provider: 'Paramount+',
        type: 'subscription',
        region: 'US / UK / AU',
        url: 'https://paramountplus.com',
        badge: 'Stream on Paramount+'
      },
      {
        provider: 'Apple TV',
        type: 'rent',
        price: '$3.99',
        region: 'Global',
        url: 'https://tv.apple.com',
        badge: 'Rent on Apple TV'
      },
      {
        provider: 'Prime Video',
        type: 'rent',
        price: '$3.99',
        region: 'Global',
        url: 'https://amazon.com/video',
        badge: 'Rent on Prime Video'
      }
    ],
    subtitlesAvailable: [
      {
        language: 'English',
        isAiAssisted: false,
        sampleDialogue: {
          original: '“Do not go gentle into that good night. Rage, rage against the dying of the light.”',
          translated: '“Do not go gentle into that good night. Rage, rage against the dying of the light.”'
        }
      },
      {
        language: 'Vietnamese',
        isAiAssisted: true,
        sampleDialogue: {
          original: '“Do not go gentle into that good night. Rage, rage against the dying of the light.”',
          translated: '“Đừng bước đi lặng lẽ vào màn đêm êm ái. Hãy giận dữ, hãy nổi giận trước sự lụi tàn của ánh sáng.”'
        }
      }
    ]
  },
  {
    id: 'severance',
    title: 'SEVERANCE',
    originalTitle: 'SEVERANCE',
    tagline: 'Please do not adjust the picture. This is your mind at work.',
    year: 2022,
    type: 'series',
    director: 'Dan Erickson & Ben Stiller',
    directorId: 'ben-stiller',
    cast: ['Adam Scott', 'Patricia Arquette', 'John Turturro', 'Christopher Walken', 'Britt Lower'],
    genres: ['Sci-Fi', 'Psychological Thriller', 'Satire'],
    moods: ['restless', 'curious', 'obsessed'],
    runtime: '2 Seasons',
    runtimeMinutes: 980,
    rating: 8.8,
    editorialQuote: '“A surgical, fluorescent autopsy of modern late-stage capitalism and fractured consciousness dressed in mid-century linoleum.”',
    synopsis: 'Mark Scout leads a team at Lumon Industries, whose employees have undergone a surgical procedure that separates their memories between their work and personal lives. When a mysterious colleague surfaces on the outside, Mark begins to uncover the terrifying truth behind the company.',
    backdropUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=85',
    posterUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=85',
    monochromePosterUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=85&sat=-100',
    aiMatchScore: 96,
    whyYouMayLike: 'You appreciate eerie symmetrical architecture, bureaucratic horror, and sharp, dry wit masking profound corporate unease.',
    aiMattersAnalysis: {
      themes: 'Workplace dissociation, identity fragmentation, corporate cultism, rebellion of the self.',
      mood: 'Clinical, claustrophobic, darkly comedic, nail-biting.',
      visualStyle: 'Uncanny seafoam green carpets, endless labyrinthine white hallways, perfectly centered retro-futuristic CRT workstations.',
      narrativeStyle: 'Tight mystery-box with deeply humane character beats.',
      emotionalIntensity: 'High — Quiet terror punctuated by bursts of rebellion.',
      audienceFit: 'Fans of Franz Kafka, The Stanley Parable, Eternal Sunshine of the Spotless Mind.'
    },
    streamingOptions: [
      {
        provider: 'Apple TV+',
        type: 'subscription',
        region: 'Global',
        url: 'https://tv.apple.com',
        badge: 'Available on Apple TV+'
      }
    ],
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1: Macrodata Refinement',
        year: 2022,
        episodeCount: 9,
        episodes: [
          {
            id: 'sev-s01e01',
            seasonNumber: 1,
            episodeNumber: 1,
            title: 'Good News About Hell',
            runtime: '57 min',
            airDate: 'Feb 18, 2022',
            thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
            synopsis: 'Mark Scout leads a team at Lumon Industries whose employees have surgically divided their memories between work and personal lives.',
            aiRecap: 'Helly R. awakens on a boardroom conference table with complete amnesia regarding her outside existence. Mark is promoted to Department Chief following the abrupt departure of his best friend Petey.',
            keyCharacters: ['Mark Scout', 'Helly R.', 'Irving Bailiff', 'Dylan G.', 'Harmony Cobel'],
            majorThemes: ['The partitioned self', 'Grief avoidance through corporate surgery'],
            emotionalTone: 'Unsettling, sterile, satirical.',
            importantEvents: ['Helly completes survey test', 'Petey approaches Mark outside Lumon in a diner'],
            beforeYouWatchNote: 'Notice the distinct change in Mark’s posture and facial slackness when the elevator reaches the basement floor.',
            playbackProgress: 100
          },
          {
            id: 'sev-s01e02',
            seasonNumber: 1,
            episodeNumber: 2,
            title: 'Half Loop',
            runtime: '53 min',
            airDate: 'Feb 18, 2022',
            thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
            synopsis: 'The team trains Helly in macrodata refinement. Mark encounters Petey on the outside and learns the dark side of reintegration.',
            aiRecap: 'Helly is taught how to categorize scary numbers on her CRT monitor based on bodily intuitive emotions: wo, fro, ma, and dr. Petey suffers severe temporal sickness in an abandoned greenhouse.',
            keyCharacters: ['Helly R.', 'Petey', 'Mark Scout', 'Milchick'],
            majorThemes: ['Intuitive emotional labor', 'Consequences of reversing memory severance'],
            emotionalTone: 'Tense, compassionate, suspicious.',
            importantEvents: ['Helly attempts to send a note to her outie', 'Petey collapses in front of Mark'],
            beforeYouWatchNote: 'Take note of the four categories of emotional numbers in Lumon’s handbook.',
            playbackProgress: 45
          }
        ]
      }
    ],
    subtitlesAvailable: [
      {
        language: 'English',
        isAiAssisted: false,
        sampleDialogue: {
          original: '“Please do not assign sentimentality to the monitors. The numbers do not have feelings; only you do.”',
          translated: '“Please do not assign sentimentality to the monitors. The numbers do not have feelings; only you do.”'
        }
      }
    ]
  },
  {
    id: 'after-yang',
    title: 'AFTER YANG',
    originalTitle: 'AFTER YANG',
    tagline: 'What does an artificial companion remember when the lights fade?',
    year: 2021,
    type: 'movie',
    director: 'Kogonada',
    directorId: 'kogonada',
    cast: ['Colin Farrell', 'Jodie Turner-Smith', 'Justin H. Min', 'Malea Emma Tjandrawidjaja'],
    genres: ['Sci-Fi', 'Drama', 'Melancholic Reflection'],
    moods: ['lonely', 'romantics'],
    runtime: '96 min',
    runtimeMinutes: 96,
    rating: 8.3,
    editorialQuote: '“A tender, luminous meditation on synthetic grief, tea ceremonies, and the quiet dignity of ordinary memory.”',
    synopsis: 'When his young daughter’s beloved companion—an android named Yang—malfunctions, Jake searches for a way to repair him. In doing so, Jake discovers the cultural brother was quietly recording short visual poems of everyday light and secret love.',
    backdropUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1920&q=85',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=900&q=85',
    monochromePosterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=900&q=85&sat=-100',
    aiMatchScore: 94,
    whyYouMayLike: 'You want quiet, gentle science fiction that prioritizes familial warmth, soft morning sunlight, and profound stillness over explosions.',
    aiMattersAnalysis: {
      themes: 'Techno-animism, synthetic mourning, adoption, the texture of micro-memories.',
      mood: 'Gentle, contemplative, melancholic, serene.',
      visualStyle: 'Warm wood-and-glass modernist organic homes, Asuka Sakamoto soundscapes, golden hour natural light.',
      narrativeStyle: 'Archival playback interspersed with quiet conversational fragments.',
      emotionalIntensity: 'Medium — Delicate, profound ache.',
      audienceFit: 'Fans of Columbus, Her, Drive My Car, and Hirokazu Kore-eda.'
    },
    streamingOptions: [
      {
        provider: 'Showtime / Paramount+',
        type: 'subscription',
        region: 'US',
        url: 'https://sho.com',
        badge: 'Stream on Showtime'
      },
      {
        provider: 'Kanopy',
        type: 'free',
        region: 'US / Public Library',
        url: 'https://kanopy.com',
        badge: 'Watch Free on Kanopy'
      },
      {
        provider: 'Apple TV',
        type: 'rent',
        price: '$3.99',
        region: 'Global',
        url: 'https://tv.apple.com',
        badge: 'Rent on Apple TV'
      }
    ],
    subtitlesAvailable: [
      {
        language: 'English',
        isAiAssisted: false,
        sampleDialogue: {
          original: '“There is no ending without a beginning, Jake. Yang was okay with the ending.”',
          translated: '“There is no ending without a beginning, Jake. Yang was okay with the ending.”'
        }
      },
      {
        language: 'Vietnamese',
        isAiAssisted: true,
        sampleDialogue: {
          original: '“There is no ending without a beginning, Jake. Yang was okay with the ending.”',
          translated: '“Không có kết thúc nào mà không có một khởi đầu, Jake à. Yang đã thanh thản với sự kết thúc.”'
        }
      }
    ]
  },
  {
    id: 'chronicle-metropolis',
    title: 'CHRONICLE OF A METROPOLIS AT DUSK',
    originalTitle: 'CHRONIQUE D’UNE MÉTROPOLE AU CRÉPUSCULE',
    tagline: 'Generated memories of a Parisian avenue that was never built.',
    year: 2025,
    type: 'ai_film',
    director: 'KAIROS Collective',
    directorId: 'kairos-collective',
    cast: ['No recorded human actors', 'Synthetic street whispers'],
    genres: ['AI Cinema', 'Architectural Documentary', 'Poetic Essay'],
    moods: ['curious', 'night-owls', 'obsessed'],
    runtime: '24 min',
    runtimeMinutes: 24,
    rating: 8.9,
    editorialQuote: '“An intoxicating fever dream of unbuilt Haussmannian futures and neon monsoons, rendered with chilling photographic fidelity.”',
    synopsis: 'Constructed entirely from generative diffusion models trained on 19th-century architectural blueprints and 1980s neon photography, this documentary explores a fictitious subterranean quarter of Paris constructed to withstand the perpetual twilight of 2088.',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=85',
    posterUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=900&q=85',
    monochromePosterUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=900&q=85&sat=-100',
    aiMatchScore: 92,
    whyYouMayLike: 'You are fascinated by generative art, urban nostalgia, and documentary forms that blur the frontier between historical archive and latent hallucination.',
    aiMattersAnalysis: {
      themes: 'Phantom architecture, artificial heritage, temporal hallucination, the obsolescence of human cartography.',
      mood: 'Enigmatic, nocturnal, opulent, dreamlike.',
      visualStyle: 'Deep sepia and sodium-vapor luminescence, simulated anamorphic grain, simulated camera wobble on antique tripod.',
      narrativeStyle: 'Voiceover essay in the tradition of Chris Marker and Walter Benjamin.',
      emotionalIntensity: 'Medium — Intellectual Vertigo.',
      audienceFit: 'Architects, cinephiles, and speculative fiction lovers.'
    },
    aiInvolvement: {
      isAiFilm: true,
      toolsUsed: ['Runway Gen-3 Alpha', 'Midjourney v6 Master Architect LoRA', 'Flux.1 Schnell', 'Descript Spatial Audio'],
      promptDirector: 'Matthieu Sorel (KAIROS)',
      workflowNotes: 'Trained on 4,000 scanned glass plates from the Archives Nationales de France mixed with contemporary generative motion vectors.'
    },
    streamingOptions: [
      {
        provider: 'YouTube 4K Curated',
        type: 'free',
        region: 'Global',
        url: 'https://youtube.com',
        badge: 'Watch on YouTube'
      },
      {
        provider: 'International Film Festival Rotterdam (IFFR Live)',
        type: 'free',
        region: 'Global',
        url: 'https://iffr.com',
        badge: 'Stream at IFFR Archive'
      }
    ],
    subtitlesAvailable: [
      {
        language: 'French (Original)',
        isAiAssisted: false,
        sampleDialogue: {
          original: '« La ville n’est qu’un rêve que le béton s’efforce de retenir. »',
          translated: '“The city is only a dream that concrete struggles to retain.”'
        }
      },
      {
        language: 'English',
        isAiAssisted: true,
        sampleDialogue: {
          original: '« La ville n’est qu’un rêve que le béton s’efforce de retenir. »',
          translated: '“The city is only a dream that concrete struggles to retain.”'
        }
      }
    ]
  },
  {
    id: 'stalker',
    title: 'STALKER',
    originalTitle: 'СТАЛКЕР',
    tagline: 'In the heart of the Zone lies a room where your innermost desire is fulfilled.',
    year: 1979,
    type: 'movie',
    director: 'Andrei Tarkovsky',
    directorId: 'andrei-tarkovsky',
    cast: ['Alexander Kaidanovsky', 'Anatoly Solonitsyn', 'Nikolai Grinko', 'Alisa Freindlich'],
    genres: ['Sci-Fi', 'Philosophical Cinema', 'Masterpiece'],
    moods: ['obsessed', 'lonely', 'curious'],
    runtime: '162 min',
    runtimeMinutes: 162,
    rating: 8.9,
    editorialQuote: '“The cathedral of slow cinema. A film where moss, rust, dripping water, and spiritual despair achieve sacred resonance.”',
    synopsis: 'A guide known as the Stalker leads a disillusioned writer and an arrogant scientist through a post-apocalyptic restricted area known as The Zone, where the laws of nature are suspended and a fabled Room promises to grant one’s deepest subconscious longing.',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=85',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=85',
    monochromePosterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=85&sat=-100',
    aiMatchScore: 91,
    whyYouMayLike: 'You seek uncompromising, transcendent philosophical cinema that rewards extreme patience with spiritual revelation.',
    aiMattersAnalysis: {
      themes: 'Faith vs. rationality, the danger of subconscious truth, radioactive industrial decay, the holy fool archetype.',
      mood: 'Hypnotic, grim, sacred, slow-burning.',
      visualStyle: 'Long unbroken takes, transition from sepia industrial rust to lush wet green overgrown landscapes, camera tracking through submerged relics.',
      narrativeStyle: 'Philosophical dialogue embedded in an allegorical physical quest.',
      emotionalIntensity: 'High — Deep Spiritual Confrontation.',
      audienceFit: 'Disciples of Bela Tarr, Ingmar Bergman, and Werner Herzog.'
    },
    streamingOptions: [
      {
        provider: 'The Criterion Channel',
        type: 'subscription',
        region: 'US / Canada',
        url: 'https://criterionchannel.com',
        badge: 'Stream on Criterion'
      },
      {
        provider: 'Mosfilm Official YouTube',
        type: 'free',
        region: 'Global',
        url: 'https://youtube.com',
        badge: 'Watch Free on Mosfilm'
      },
      {
        provider: 'MUBI',
        type: 'subscription',
        region: 'UK / EU',
        url: 'https://mubi.com',
        badge: 'Available on MUBI'
      }
    ],
    subtitlesAvailable: [
      {
        language: 'Russian (Original)',
        isAiAssisted: false,
        sampleDialogue: {
          original: '“Пусть исполнится то, что задумано. Пусть они поверят. И пусть посмеются над своими страстями.”',
          translated: '“Let everything that’s been planned come true. Let them believe. And let them have a laugh at their passions.”'
        }
      },
      {
        language: 'English',
        isAiAssisted: false,
        sampleDialogue: {
          original: '“Let them believe. And let them have a laugh at their passions.”',
          translated: '“Let them believe. And let them have a laugh at their passions.”'
        }
      }
    ]
  },
  {
    id: 'past-lives',
    title: 'PAST LIVES',
    originalTitle: '인연 (PAST LIVES)',
    tagline: 'In this life, we are who we are. But in another life, who could we have been?',
    year: 2023,
    type: 'movie',
    director: 'Celine Song',
    directorId: 'celine-song',
    cast: ['Greta Lee', 'Teo Yoo', 'John Magaro'],
    genres: ['Romance', 'Drama', 'Contemporary Masterpiece'],
    moods: ['romantics', 'lonely'],
    runtime: '105 min',
    runtimeMinutes: 105,
    rating: 8.4,
    editorialQuote: '“A heartbreakingly graceful exploration of unlived destinies, immigrant longing, and the sacred silence between two gazes across a New York subway bar.”',
    synopsis: 'Nora and Hae Sung, two deeply connected childhood friends, are wrested apart after Nora’s family emigrates from South Korea. Decades later, they are reunited in New York for one fateful week as they confront notions of destiny, love, and the choices that make a life.',
    backdropUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1920&q=85',
    posterUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=85',
    monochromePosterUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=85&sat=-100',
    aiMatchScore: 93,
    whyYouMayLike: 'You crave adult, mature romantic cinema that respects every participant and finds monumental emotion in the softest pauses.',
    aiMattersAnalysis: {
      themes: 'In-Yeon (fate across reincarnations), cultural displacement, nostalgic grief, emotional integrity.',
      mood: 'Gentle, piercingly bittersweet, intimate, elegant.',
      visualStyle: '35mm grain warmth, East Village nighttime cobblestone reflections, carousel neon in Brooklyn Bridge Park.',
      narrativeStyle: 'Tri-act generational jumps spanning 24 years.',
      emotionalIntensity: 'High — Devastatingly Quiet Catharsis.',
      audienceFit: 'Fans of Before Sunset, In the Mood for Love, and Brief Encounter.'
    },
    streamingOptions: [
      {
        provider: 'Netflix',
        type: 'subscription',
        region: 'US / Selected Regions',
        url: 'https://netflix.com',
        badge: 'Available on Netflix'
      },
      {
        provider: 'Apple TV',
        type: 'rent',
        price: '$3.99',
        region: 'Global',
        url: 'https://tv.apple.com',
        badge: 'Rent on Apple TV'
      }
    ],
    subtitlesAvailable: [
      {
        language: 'Korean & English',
        isAiAssisted: false,
        sampleDialogue: {
          original: '“In-yeon means if two strangers brush against each other on the street, it means there must be something between them in their past lives.”',
          translated: '“In-yeon means if two strangers brush against each other on the street, it means there must be something between them in their past lives.”'
        }
      }
    ]
  },
  {
    id: 'son-of-sun',
    title: 'SON OF THE SUN',
    originalTitle: 'SON OF THE SUN',
    tagline: 'A solar flare strikes an orbital solar-harvesting satellite.',
    year: 2025,
    type: 'ai_film',
    director: 'Aria Thorne',
    directorId: 'aria-thorne',
    cast: ['Synthesized Narration', 'Plasma Field Resonance'],
    genres: ['AI Cinema', 'Hard Sci-Fi Short', 'Visual Poem'],
    moods: ['restless', 'night-owls'],
    runtime: '12 min',
    runtimeMinutes: 12,
    rating: 8.6,
    editorialQuote: '“Twelve minutes of incandescent visual vertigo that turns solar physics into a religious epiphany.”',
    synopsis: 'A lone maintenance android on the Helios-IV collector ring witnesses a coronal mass ejection that strips its sensor array down to raw electromagnetic infrared frequencies.',
    backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=85',
    posterUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=900&q=85',
    monochromePosterUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=900&q=85&sat=-100',
    aiMatchScore: 88,
    whyYouMayLike: 'You have only 15 minutes and want an exhilarating, visually unprecedented cosmic journey.',
    aiMattersAnalysis: {
      themes: 'Solar worship, technological fragility, sublime scale of cosmic forces.',
      mood: 'Incandescent, frantic, transcendent.',
      visualStyle: 'Blinding golds and deep void blacks, microscopic plasma simulation, lens combustion effects.',
      narrativeStyle: 'Telemetry countdown accompanied by synthesized breathing.',
      emotionalIntensity: 'High — Pure Sensory Shock.',
      audienceFit: 'Fans of Sunshine, The Tree of Life, and 2001 stargate sequence.'
    },
    aiInvolvement: {
      isAiFilm: true,
      toolsUsed: ['Runway Gen-3', 'Flux Pro Solar Fluid Simulation', 'ElevenLabs Neural Synth'],
      promptDirector: 'Aria Thorne',
      workflowNotes: 'Created using physical solar flare spectrograms converted directly into generative latent motion vectors.'
    },
    streamingOptions: [
      {
        provider: 'Vimeo Staff Pick Premiere',
        type: 'free',
        region: 'Global',
        url: 'https://vimeo.com',
        badge: 'Watch Free on Vimeo'
      },
      {
        provider: 'YouTube 4K Ultra',
        type: 'free',
        region: 'Global',
        url: 'https://youtube.com',
        badge: 'Watch on YouTube'
      }
    ],
    subtitlesAvailable: [
      {
        language: 'English',
        isAiAssisted: false,
        sampleDialogue: {
          original: '“To stare directly at God is to burn out your ocular nerves in four milliseconds.”',
          translated: '“To stare directly at God is to burn out your ocular nerves in four milliseconds.”'
        }
      }
    ]
  },
  {
    id: 'perfect-days',
    title: 'PERFECT DAYS',
    originalTitle: 'PERFECT DAYS',
    tagline: 'Now is now. Next time is next time.',
    year: 2023,
    type: 'movie',
    director: 'Wim Wenders',
    directorId: 'wim-wenders',
    cast: ['Koji Yakusho', 'Tokio Emoto', 'Arisa Nakano', 'Aoi Yamada'],
    genres: ['Drama', 'Slow Cinema', 'Zen Masterpiece'],
    moods: ['lonely', 'romantics'],
    runtime: '124 min',
    runtimeMinutes: 124,
    rating: 8.5,
    editorialQuote: '“An antidote to the hyper-stimulated digital age. A film of immense moral clarity and quiet ecstasy.”',
    synopsis: 'Hirayama seems entirely content with his simple life as a cleaner of public toilets in Tokyo. Outside of his structured routine, he cherishes his passion for music on cassette tapes, classic literature, and photographing the sunlight filtering through trees.',
    backdropUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1920&q=85',
    posterUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=85',
    monochromePosterUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=85&sat=-100',
    aiMatchScore: 90,
    whyYouMayLike: 'You feel exhausted by frantic modern noise and need a warm, grounding cinematic bath of morning rituals and Lou Reed cassettes.',
    aiMattersAnalysis: {
      themes: 'Komorebi (sunlight filtering through leaves), contentment in humble labor, analog memory, chosen solitary peace.',
      mood: 'Joyful, peaceful, gentle, deeply moving.',
      visualStyle: 'Square Academy ratio, morning Tokyo twilight, intimate close-ups of smiling eyes.',
      narrativeStyle: 'Cyclical daily routine repeated with subtle organic variations.',
      emotionalIntensity: 'Medium — Quiet Euphoria.',
      audienceFit: 'Fans of Yasujirō Ozu, Jim Jarmusch (Paterson), and Wim Wenders.'
    },
    streamingOptions: [
      {
        provider: 'Hulu',
        type: 'subscription',
        region: 'US',
        url: 'https://hulu.com',
        badge: 'Stream on Hulu'
      },
      {
        provider: 'MUBI',
        type: 'subscription',
        region: 'UK / EU / Latin America',
        url: 'https://mubi.com',
        badge: 'Available on MUBI'
      },
      {
        provider: 'Apple TV',
        type: 'rent',
        price: '$3.99',
        region: 'Global',
        url: 'https://tv.apple.com',
        badge: 'Rent on Apple TV'
      }
    ],
    subtitlesAvailable: [
      {
        language: 'Japanese (Original)',
        isAiAssisted: false,
        sampleDialogue: {
          original: '「今度は今度、今は今。」',
          translated: '“Next time is next time. Now is now.”'
        }
      },
      {
        language: 'English',
        isAiAssisted: false,
        sampleDialogue: {
          original: '“Next time is next time. Now is now.”',
          translated: '“Next time is next time. Now is now.”'
        }
      }
    ]
  },
  {
    id: 'blade-runner-2049',
    title: 'BLADE RUNNER 2049',
    originalTitle: 'BLADE RUNNER 2049',
    tagline: 'There is still a little of each of us in every code.',
    year: 2017,
    type: 'movie',
    director: 'Denis Villeneuve',
    directorId: 'denis-villeneuve',
    cast: ['Ryan Gosling', 'Harrison Ford', 'Ana de Armas', 'Sylvia Hoeks'],
    genres: ['Sci-Fi', 'Neo-Noir', 'Mystery'],
    moods: ['restless', 'night-owls', 'lonely'],
    runtime: '164 min',
    runtimeMinutes: 164,
    rating: 8.6,
    editorialQuote: '“Roger Deakins transforms brutalist smog and radioactive orange dust into modern biblical tableaux.”',
    synopsis: 'Officer K, a new blade runner for the Los Angeles Police Department, unearths a long-buried secret that has the potential to plunge what is left of society into chaos.',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=85',
    posterUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=900&q=85',
    monochromePosterUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=900&q=85&sat=-100',
    aiMatchScore: 92,
    whyYouMayLike: 'You adore massive, resonant soundscapes, radioactive orange Las Vegas ruins, and tragic artificial souls longing to be special.',
    aiMattersAnalysis: {
      themes: 'The authenticity of artificial devotion, miraculous birth, memory implants, loneliness in crowds.',
      mood: 'Monolithic, melancholic, grand, atmospheric.',
      visualStyle: 'Towering holograms in perpetual freezing rain, brutalist monoliths, pure radioactive neon hues.',
      narrativeStyle: 'Detective investigation peeling away layers of identity.',
      emotionalIntensity: 'High — Somber and heart-wrenching climax.',
      audienceFit: 'Lovers of Philip K. Dick, Ridley Scott, and Hans Zimmer.'
    },
    streamingOptions: [
      {
        provider: 'Max',
        type: 'subscription',
        region: 'US',
        url: 'https://max.com',
        badge: 'Stream on Max'
      },
      {
        provider: 'Prime Video',
        type: 'rent',
        price: '$3.99',
        region: 'Global',
        url: 'https://amazon.com/video',
        badge: 'Rent on Prime Video'
      }
    ],
    subtitlesAvailable: [
      {
        language: 'English',
        isAiAssisted: false,
        sampleDialogue: {
          original: '“Dying for the right cause. It’s the most human thing we can do.”',
          translated: '“Dying for the right cause. It’s the most human thing we can do.”'
        }
      }
    ]
  },
  {
    id: 'frieren-journey',
    title: 'FRIEREN: BEYOND JOURNEY’S END',
    originalTitle: 'Sōsō no Frieren (葬送のフリーレン)',
    tagline: 'The journey ends, but the understanding of human hearts has only just begun.',
    year: 2023,
    type: 'anime',
    director: 'Keiichirō Saitō',
    directorId: 'keiichiro-saito',
    cast: ['Atsumi Tanezaki', 'Nobuhiko Okamoto', 'Hiroki Touchi', 'Kana Ichinose'],
    genres: ['Anime', 'Fantasy', 'Adventure', 'Drama'],
    moods: ['lonely', 'romantics', 'curious'],
    runtime: '1 Season · 28 Episodes',
    runtimeMinutes: 672,
    rating: 9.3,
    editorialQuote: '“A profoundly gentle and magnificent meditation on the fleeting beauty of mortal time through the eyes of an immortal elf.”',
    synopsis: 'Sau khi cùng đồng đội tiêu diệt Quỷ Vương và mang lại hòa bình cho nhân loại, pháp sư elf Frieren tiếp tục cuộc sống dài vô tận của mình. Sau sự ra đi vì tuổi già của người dũng sĩ Himmel, Frieren nhận ra cô biết quá ít về con người và bắt đầu một hải trình mới để học cách thấu hiểu trái tim nhân loại.',
    backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1920&q=85',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=85',
    monochromePosterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=85&sat=-100',
    aiMatchScore: 97,
    whyYouMayLike: 'Bạn say mê những câu chuyện kỳ ảo tĩnh lặng, phong cảnh núi rừng hùng vĩ và triết lý sâu sắc về ký ức và sự trân trọng từng khoảnh khắc ngắn ngủi.',
    aiMattersAnalysis: {
      themes: 'Dòng chảy thời gian, tình cảm con người, sự nuối tiếc và ký ức vĩnh cửu.',
      mood: 'Bình yên, hoài niệm, tráng lệ, ấm áp.',
      visualStyle: 'Hoạt họa tinh xảo của xưởng Madhouse, bảng màu pastel thơ mộng và những pha hành động ma thuật đỉnh cao.',
      narrativeStyle: 'Chậm rãi, giàu cảm xúc kết hợp những cuộc đối thoại đầy ẩn ý.',
      emotionalIntensity: 'High — Xúc động sâu lắng từng tập phim.',
      audienceFit: 'Khán giả yêu thích Violet Evergarden, Spirited Away và Mushishi.'
    },
    streamingOptions: [
      {
        provider: 'Netflix',
        type: 'subscription',
        region: 'Global / VN',
        url: 'https://netflix.com',
        badge: 'Xem trên Netflix'
      },
      {
        provider: 'Crunchyroll',
        type: 'subscription',
        region: 'Global',
        url: 'https://crunchyroll.com',
        badge: 'Crunchyroll Premium'
      },
      {
        provider: 'Muse Vietnam (YouTube)',
        type: 'free',
        region: 'VN',
        url: 'https://youtube.com',
        badge: 'Xem miễn phí trên YouTube'
      }
    ],
    seasons: [
      {
        seasonNumber: 1,
        title: 'Mùa 1: Hành trình về phương Bắc',
        year: 2023,
        episodeCount: 28,
        episodes: [
          {
            id: 'frieren-s01e01',
            seasonNumber: 1,
            episodeNumber: 1,
            title: 'Hành trình kết thúc (The Journey\'s End)',
            runtime: '24 min',
            airDate: 'Sep 29, 2023',
            thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
            synopsis: 'Nhóm người hùng khải hoàn trở về thủ đô sau 10 năm hành trình. Frieren rời đi để tiếp tục sở thích tìm kiếm phép thuật và trở lại 50 năm sau.',
            aiRecap: 'Frieren nhận ra 50 năm chỉ là một cái chớp mắt đối với tộc elf, nhưng là cả một đời người đối với Himmel. Nước mắt rơi tại đám tang Himmel mở ra mục đích mới cho cô.',
            keyCharacters: ['Frieren', 'Himmel', 'Heiter', 'Eisen'],
            majorThemes: ['Khoảng cách tuổi thọ giữa các chủng tộc', 'Giá trị của những kỷ niệm bình dị'],
            emotionalTone: 'Hoài niệm, êm đềm, rưng rưng xúc động.',
            importantEvents: ['Mưa sao băng thế kỷ', 'Himmel qua đời', 'Frieren nhận đệ tử Fern'],
            beforeYouWatchNote: 'Hãy chuẩn bị khăn giấy cho đoạn kết của tập 1.',
            playbackProgress: 100
          },
          {
            id: 'frieren-s01e02',
            seasonNumber: 1,
            episodeNumber: 2,
            title: 'Không phải vì tôi muốn (It Didn\'t Have to Be Magic...)',
            runtime: '24 min',
            airDate: 'Sep 29, 2023',
            thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
            synopsis: 'Heiter nhờ Frieren giải mã một cuốn cổ thư ma thuật và nhận nuôi cô bé mồ côi Fern.',
            aiRecap: 'Fern nỗ lực tập luyện ma thuật để có thể sống tự lập trước khi Heiter qua đời. Frieren đồng ý đưa Fern theo cùng trong chuyến hành trình mới.',
            keyCharacters: ['Frieren', 'Fern', 'Heiter'],
            majorThemes: ['Sự trưởng thành của người phàm', 'Lời hứa với người bạn cũ'],
            emotionalTone: 'Ấm áp, kiên nhẫn.',
            importantEvents: ['Fern bắn thủng tảng đá bằng ma thuật', 'Heiter yên nghỉ'],
            beforeYouWatchNote: 'Chú ý cách Frieren dạy Fern tính kiên nhẫn.',
            playbackProgress: 85
          }
        ]
      }
    ],
    subtitlesAvailable: [
      {
        language: 'Tiếng Việt',
        isAiAssisted: false,
        sampleDialogue: {
          original: '“Tôi chỉ vừa bắt đầu muốn hiểu về con người...”',
          translated: '“Tôi chỉ vừa bắt đầu muốn hiểu về con người...”'
        }
      },
      {
        language: 'English',
        isAiAssisted: false,
        sampleDialogue: {
          original: '“It was only ten years. Why am I crying?”',
          translated: '“Chỉ là 10 năm thôi mà. Tại sao tôi lại khóc?”'
        }
      }
    ]
  },
  {
    id: 'spirited-away',
    title: 'SPIRITED AWAY',
    originalTitle: 'Sen to Chihiro no Kamikakushi (千と千尋の神隠し)',
    tagline: 'The tunnel led to a world beyond mortal imagination.',
    year: 2001,
    type: 'anime',
    director: 'Hayao Miyazaki',
    directorId: 'hayao-miyazaki',
    cast: ['Rumi Hiiragi', 'Miyu Irino', 'Mari Natsuki'],
    genres: ['Anime', 'Animation', 'Fantasy', 'Family'],
    moods: ['curious', 'romantics'],
    runtime: '125 min',
    runtimeMinutes: 125,
    rating: 8.6,
    editorialQuote: '“Kiệt tác bất hủ của Studio Ghibli, nơi tâm hồn thơ ấu đối mặt với lòng tham, lòng trắc ẩn và biển nước mênh mông.”',
    synopsis: 'Cô bé Chihiro 10 tuổi vô tình bước vào một thị trấn bí ẩn nơi các linh hồn nghỉ ngơi. Khi cha mẹ bị biến thành heo vì lòng tham, Chihiro phải làm việc tại nhà tắm công cộng của mụ phù thủy Yubaba và tìm cách cứu gia đình.',
    backdropUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=85',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=85',
    monochromePosterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=85&sat=-100',
    aiMatchScore: 95,
    whyYouMayLike: 'Cảnh đoàn tàu chạy trên mặt nước biển vô tận là một trong những khoảnh khắc điện ảnh thi vị và biểu tượng nhất trong lịch sử hoạt hình thế giới.',
    aiMattersAnalysis: {
      themes: 'Lòng can đảm tuổi thơ, bảo tồn thiên nhiên, bản sắc và ký ức về tên gọi.',
      mood: 'Huyền bí, lộng lẫy, kỳ ảo, ấm lòng.',
      visualStyle: 'Hoạt hình vẽ tay bậc thầy của Ghibli, kiến trúc nhà tắm cổ kính và phong cảnh biển ngập nước tuyệt mỹ.',
      narrativeStyle: 'Hành trình trưởng thành vượt qua thử thách.',
      emotionalIntensity: 'High — Đong đầy cảm xúc trong trẻo.',
      audienceFit: 'Mọi lứa tuổi, người yêu thích văn hóa dân gian và nghệ thuật truyền thống.'
    },
    streamingOptions: [
      {
        provider: 'Netflix',
        type: 'subscription',
        region: 'Global / VN',
        url: 'https://netflix.com',
        badge: 'Xem trên Netflix'
      },
      {
        provider: 'Apple TV',
        type: 'rent',
        price: '$3.99',
        region: 'Global',
        url: 'https://apple.com/tv',
        badge: 'Thuê trên Apple TV'
      }
    ],
    subtitlesAvailable: [
      {
        language: 'Tiếng Việt',
        isAiAssisted: false,
        sampleDialogue: {
          original: '“Một khi đã gặp ai đó, bạn sẽ không bao giờ thực sự quên họ.”',
          translated: '“Một khi đã gặp ai đó, bạn sẽ không bao giờ thực sự quên họ.”'
        }
      }
    ]
  }
];
