import { knowledgeBase, type KnowledgeChunk } from './knowledgeBase';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'am', 'be', 'been', 'being',
  'what', 'how', 'when', 'where', 'who', 'why', 'can', 'could', 'should', 'would',
  'i', 'me', 'my', 'mine', 'we', 'us', 'our', 'you', 'your', 'yours', 'he', 'him', 'his',
  'she', 'her', 'hers', 'it', 'its', 'they', 'them', 'their', 'theirs',
  'do', 'does', 'did', 'have', 'has', 'had', 'to', 'from', 'in', 'out', 'on', 'off',
  'with', 'without', 'about', 'for', 'of', 'and', 'or', 'but', 'if', 'so', 'as', 'at',
  'this', 'that', 'these', 'those', 'then', 'there', 'here', 'all', 'any', 'some'
]);

function tokenize(text: string): string[] {
  // Remove punctuation and lowercase
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '');
  const tokens = cleanText.split(/\s+/).filter(word => word.length > 0);
  return tokens.filter(word => !STOP_WORDS.has(word));
}

export function retrieveChunks(query: string, topK: number = 3): KnowledgeChunk[] {
  const queryTokens = tokenize(query);
  
  if (queryTokens.length === 0) {
    return [];
  }

  const scoredChunks = knowledgeBase.map(chunk => {
    let score = 0;
    
    // Convert chunk content and keywords to lowercase strings/tokens for matching
    const contentTokens = tokenize(chunk.content);
    const keywords = chunk.keywords.map(k => k.toLowerCase());

    for (const token of queryTokens) {
      // Keyword match = 2 points per keyword matched
      // Some keywords might be multi-word, so we check if keyword includes token or token equals keyword
      for (const keyword of keywords) {
        if (keyword.includes(token)) {
          score += 2;
        }
      }

      // Content match = 1 point per occurrence in content
      const contentMatches = contentTokens.filter(ct => ct === token).length;
      score += (contentMatches * 1);
    }

    return { chunk, score };
  });

  // Filter out chunks with 0 score
  const matches = scoredChunks.filter(sc => sc.score > 0);

  // Sort descending by score
  matches.sort((a, b) => b.score - a.score);

  const topMatches = matches.slice(0, topK).map(m => m.chunk);

  // Only log in Vite dev mode — guard against import.meta.env being undefined in test environments
  const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
  if (isDev) {
    console.log('[RAG Retriever] Query:', query);
    console.log('[RAG Retriever] Retrieved IDs:', topMatches.map(c => c.id));
  }

  return topMatches;
}
