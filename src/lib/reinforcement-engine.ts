/**
 * PetalPath — Reinforcement Engine
 *
 * Generates dynamic reinforcement activities between videos.
 * Activities mix recent topics, weak topics, and simple physical prompts.
 * 
 * Used by the curriculum engine every N videos to consolidate learning.
 */

import type { CurriculumDomain } from './types'

// ─── Types ───────────────────────────────────────────────────────

export interface ReinforcementActivity {
    type: 'speech' | 'physical' | 'find' | 'recall'
    prompt: string        // Child-friendly instruction
    topic: string         // Related topic (letter, number, shape...)
    domain: CurriculumDomain
    emoji: string         // Visual cue
}

// ─── Activity Templates ─────────────────────────────────────────

interface ActivityTemplate {
    type: ReinforcementActivity['type']
    template: (topic: string) => string
    emoji: string
    domains: CurriculumDomain[]  // Which domains this template works for
}

const ACTIVITY_TEMPLATES: ActivityTemplate[] = [
    // ─── Speech activities ───
    {
        type: 'speech',
        template: (t) => `Say "${t}" out loud!`,
        emoji: '🗣',
        domains: ['alphabet', 'phonics', 'numbers'],
    },
    {
        type: 'speech',
        template: (t) => `Can you say the sound of "${t}"?`,
        emoji: '🔊',
        domains: ['alphabet', 'phonics'],
    },
    {
        type: 'speech',
        template: (t) => `Count to ${t} with me!`,
        emoji: '🔢',
        domains: ['numbers'],
    },
    {
        type: 'speech',
        template: (t) => `What shape is this? "${t}"!`,
        emoji: '🔺',
        domains: ['shapes'],
    },
    {
        type: 'speech',
        template: (t) => `Sing the letter "${t}"! La la la!`,
        emoji: '🎵',
        domains: ['alphabet'],
    },

    // ─── Physical activities ───
    {
        type: 'physical',
        template: (t) => `Clap ${Math.min(parseInt(t) || 3, 5)} times!`,
        emoji: '👏',
        domains: ['numbers'],
    },
    {
        type: 'physical',
        template: (t) => `Jump like the letter "${t}"!`,
        emoji: '🤸',
        domains: ['alphabet', 'phonics'],
    },
    {
        type: 'physical',
        template: (t) => `Draw a ${t.toLowerCase()} in the air with your finger!`,
        emoji: '☝️',
        domains: ['shapes', 'alphabet'],
    },
    {
        type: 'physical',
        template: (t) => `Stomp your feet ${Math.min(parseInt(t) || 3, 5)} times!`,
        emoji: '🦶',
        domains: ['numbers'],
    },
    {
        type: 'physical',
        template: () => `Touch your nose, then your toes!`,
        emoji: '🤡',
        domains: ['numbers', 'alphabet', 'phonics', 'shapes'],
    },
    {
        type: 'physical',
        template: () => `Spin around once!`,
        emoji: '🌀',
        domains: ['numbers', 'alphabet', 'phonics', 'shapes'],
    },

    // ─── Find activities ───
    {
        type: 'find',
        template: (t) => `Find something shaped like a ${t.toLowerCase()} around you!`,
        emoji: '🔍',
        domains: ['shapes'],
    },
    {
        type: 'find',
        template: (t) => `Find something that starts with "${t}"!`,
        emoji: '🔎',
        domains: ['alphabet', 'phonics'],
    },
    {
        type: 'find',
        template: (t) => `Find ${t} things around you!`,
        emoji: '👀',
        domains: ['numbers'],
    },
    {
        type: 'find',
        template: () => `Find something red around you!`,
        emoji: '🔴',
        domains: ['numbers', 'alphabet', 'phonics', 'shapes'],
    },

    // ─── Recall activities ───
    {
        type: 'recall',
        template: (t) => `What did we learn about "${t}"? Tell me!`,
        emoji: '🧠',
        domains: ['alphabet', 'phonics', 'numbers', 'shapes'],
    },
    {
        type: 'recall',
        template: (t) => `What comes after "${t}"?`,
        emoji: '➡️',
        domains: ['alphabet', 'numbers'],
    },
]

// ─── Core Generator (Data-Driven) ───────────────────────────────

/**
 * Generates a single reinforcement activity.
 * Topic selection priority: weak topics > recent topics > domain defaults.
 * Template selection uses a seeded rotation to avoid pure randomness
 * while maintaining variety.
 */
export function generateReinforcement(
    recentTopics: string[],
    weakTopics: string[],
    domain: CurriculumDomain,
    rotationSeed?: number
): ReinforcementActivity {
    // ─── Topic Selection (deterministic priority) ───
    // Weak topics ALWAYS come first — this is data-driven
    let topic: string
    if (weakTopics.length > 0) {
        // Rotate through weak topics based on seed
        const idx = (rotationSeed ?? 0) % weakTopics.length
        topic = weakTopics[idx]
    } else if (recentTopics.length > 0) {
        // Cycle through recent topics (most recent first)
        const idx = (rotationSeed ?? 0) % recentTopics.length
        topic = recentTopics[idx]
    } else {
        topic = getDefaultTopic(domain)
    }

    // ─── Template Selection (rotated, not random) ───
    const validTemplates = ACTIVITY_TEMPLATES.filter(t =>
        t.domains.includes(domain)
    )

    const seed = rotationSeed ?? (topic.charCodeAt(0) + recentTopics.length)
    const template = validTemplates.length > 0
        ? validTemplates[seed % validTemplates.length]
        : ACTIVITY_TEMPLATES[0]

    return {
        type: template.type,
        prompt: template.template(topic),
        topic,
        domain,
        emoji: template.emoji,
    }
}

// ─── Generate multiple reinforcement activities ─────────────────

export function generateReinforcementSet(
    recentTopics: string[],
    weakTopics: string[],
    domain: CurriculumDomain,
    count: number = 3
): ReinforcementActivity[] {
    const activities: ReinforcementActivity[] = []
    const usedTypes = new Set<string>()

    for (let i = 0; i < count; i++) {
        let activity = generateReinforcement(recentTopics, weakTopics, domain, i)

        // Rotate template if type was already used
        let rotationOffset = 0
        while (usedTypes.has(activity.type) && rotationOffset < 8) {
            rotationOffset++
            activity = generateReinforcement(recentTopics, weakTopics, domain, i + rotationOffset * 7)
        }

        usedTypes.add(activity.type)
        activities.push(activity)
    }

    return activities
}

// ─── Targeted Weak Topic Reinforcement ──────────────────────────

/**
 * Generates reinforcement activities specifically targeting weak topics.
 * Each weak topic gets its own dedicated activity, ensuring the child
 * practices exactly what they struggled with.
 */
export function generateReinforcementForWeakTopics(
    weakTopics: string[],
    domain: CurriculumDomain
): ReinforcementActivity[] {
    if (weakTopics.length === 0) return []

    const activities: ReinforcementActivity[] = []
    const usedTypes = new Set<string>()

    // One activity per weak topic (max 3 to avoid overwhelm)
    const topicsToReinforce = weakTopics.slice(0, 3)

    for (let i = 0; i < topicsToReinforce.length; i++) {
        const topic = topicsToReinforce[i]

        // Get templates for this domain
        const validTemplates = ACTIVITY_TEMPLATES.filter(t =>
            t.domains.includes(domain)
        )

        // Prefer speech activities for weak topics (most educational)
        const speechTemplates = validTemplates.filter(t => t.type === 'speech')
        const recallTemplates = validTemplates.filter(t => t.type === 'recall')
        const otherTemplates = validTemplates.filter(t => !usedTypes.has(t.type))

        // Priority: speech > recall > any unused type
        let template = speechTemplates.find(t => !usedTypes.has(t.type))
            || recallTemplates.find(t => !usedTypes.has(t.type))
            || otherTemplates[0]
            || validTemplates[i % validTemplates.length]

        usedTypes.add(template.type)

        activities.push({
            type: template.type,
            prompt: template.template(topic),
            topic,
            domain,
            emoji: template.emoji,
        })
    }

    return activities
}

// ─── Default topics by domain ───────────────────────────────────

function getDefaultTopic(domain: CurriculumDomain): string {
    switch (domain) {
        case 'numbers':  return '3'
        case 'alphabet': return 'A'
        case 'phonics':  return 'A'
        case 'shapes':   return 'circle'
        default:         return 'A'
    }
}

