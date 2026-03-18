import type { VaultNote, VaultStore } from './state/vaultStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VaultGenerator {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide-react-native icon name
  folderId: string | null;
  generate(
    vaultId: string,
    store: VaultStore,
  ): { note: Partial<VaultNote>; folderPath?: string };
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

export const VAULT_GENERATORS: VaultGenerator[] = [
  {
    id: 'launch-plan',
    name: 'Launch Plan',
    description: 'Structure your product or feature launch with goals, timeline, and risks.',
    icon: 'Rocket',
    folderId: null,
    generate(vaultId, _store) {
      const title = 'Launch Plan';
      const content = `# Launch Plan

## Overview

Describe what you're launching and why it matters.

## Goals

- [ ] Goal 1
- [ ] Goal 2
- [ ] Goal 3

## Timeline

| Phase | Target Date | Owner |
|-------|-------------|-------|
| Planning | | |
| Development | | |
| Testing | | |
| Launch | | |

## Risks

### Risk 1
**Impact:** Medium
**Mitigation:**

### Risk 2
**Impact:** Low
**Mitigation:**

## Dependencies

- Dependency 1
- Dependency 2

## Success Metrics

- Metric 1
- Metric 2
`;
      return {
        note: {
          title,
          content,
          vaultId,
          folderId: null,
          parsedLinks: [],
        },
      };
    },
  },

  {
    id: 'research-report',
    name: 'Research Report',
    description: 'Capture findings, sources, and conclusions from your research.',
    icon: 'FlaskConical',
    folderId: null,
    generate(vaultId, _store) {
      const title = 'Research Report';
      const content = `# Research Report

## Summary

A brief overview of the research topic and key takeaways.

## Findings

### Finding 1

Detail the first major finding here.

### Finding 2

Detail the second major finding here.

### Finding 3

Detail the third major finding here.

## Sources

1. Source title — [link or reference]
2. Source title — [link or reference]
3. Source title — [link or reference]

## Conclusions

What does this research tell us? What decisions does it inform?

### Next Steps

- [ ] Action from research
- [ ] Follow-up investigation
`;
      return {
        note: {
          title,
          content,
          vaultId,
          folderId: null,
          parsedLinks: [],
        },
      };
    },
  },

  {
    id: 'content-script',
    name: 'Content Script',
    description: 'Write a compelling script with hook, problem, solution, and CTA.',
    icon: 'Video',
    folderId: null,
    generate(vaultId, _store) {
      const title = 'Content Script';
      const content = `# Content Script

## Hook

Open with something that grabs attention in the first 3 seconds.

> "..."

## Problem

What pain or desire does your audience have?

- Pain point 1
- Pain point 2

## Solution

How does your content, product, or idea solve this?

### Key Message

The one thing they should remember.

### Supporting Points

1. Point one
2. Point two
3. Point three

## CTA (Call to Action)

What should they do next?

> "..."

## Notes

- Target audience:
- Platform:
- Duration:
- Tone:
`;
      return {
        note: {
          title,
          content,
          vaultId,
          folderId: null,
          parsedLinks: [],
        },
      };
    },
  },

  {
    id: 'ad-concepts',
    name: 'Ad Concepts',
    description: 'Brainstorm multiple ad angles with audience, tone, and platform notes.',
    icon: 'Megaphone',
    folderId: null,
    generate(vaultId, _store) {
      const title = 'Ad Concepts';
      const content = `# Ad Concepts

## Audience

Who are we targeting?

- Primary:
- Secondary:
- Demographics:
- Key pain point:

## Tone

- Voice:
- Feeling we want to evoke:

## Platform

- [ ] Instagram / TikTok (short-form video)
- [ ] Facebook (carousel/static)
- [ ] YouTube (pre-roll)
- [ ] Search (copy only)

---

## Concept A

**Angle:**

**Headline:**

**Body:**

**Visual:**

**CTA:**

---

## Concept B

**Angle:**

**Headline:**

**Body:**

**Visual:**

**CTA:**

---

## Concept C

**Angle:**

**Headline:**

**Body:**

**Visual:**

**CTA:**

---

## Notes

Which concept feels strongest and why?
`;
      return {
        note: {
          title,
          content,
          vaultId,
          folderId: null,
          parsedLinks: [],
        },
      };
    },
  },

  {
    id: 'strategy-memo',
    name: 'Strategy Memo',
    description: 'Align your team on situation, objective, approach, and next steps.',
    icon: 'FileChartLine',
    folderId: null,
    generate(vaultId, _store) {
      const title = 'Strategy Memo';
      const content = `# Strategy Memo

**Date:** ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
**Author:**
**Status:** Draft

---

## Situation

What is the current state of affairs? What problem or opportunity exists?

## Objective

What do we want to achieve? Be specific and time-bound.

> "By [date], we will [specific outcome]."

## Approach

How will we get there?

### Option A (Recommended)

**Summary:**

**Pros:**
-

**Cons:**
-

### Option B

**Summary:**

**Pros:**
-

**Cons:**
-

## Metrics

How will we know if we're succeeding?

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| | | | |

## Next Steps

- [ ] Action item — Owner — Due date
- [ ] Action item — Owner — Due date
- [ ] Action item — Owner — Due date

---

*Questions or feedback? Comment below.*
`;
      return {
        note: {
          title,
          content,
          vaultId,
          folderId: null,
          parsedLinks: [],
        },
      };
    },
  },
];
