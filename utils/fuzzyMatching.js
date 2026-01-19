// lib/utils/fuzzyMatching.js - Advanced fuzzy and phonetic matching

/**
 * Calculate Levenshtein distance between two strings
 * Returns number of single-character edits (insertions, deletions, substitutions)
 */
export function levenshteinDistance(str1, str2) {
  const s1 = str1.toLowerCase()
  const s2 = str2.toLowerCase()
  
  const len1 = s1.length
  const len2 = s2.length
  
  // Create 2D array for dynamic programming
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0))
  
  // Initialize first column and row
  for (let i = 0; i <= len1; i++) matrix[i][0] = i
  for (let j = 0; j <= len2; j++) matrix[0][j] = j
  
  // Fill in the rest of the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }
  
  return matrix[len1][len2]
}

/**
 * Calculate similarity ratio (0 to 1) based on Levenshtein distance
 */
export function similarityRatio(str1, str2) {
  const distance = levenshteinDistance(str1, str2)
  const maxLen = Math.max(str1.length, str2.length)
  return maxLen === 0 ? 1 : 1 - (distance / maxLen)
}

/**
 * Soundex algorithm - encodes strings based on how they sound
 * "Samsung" -> "S552"
 * "Zamzung" -> "Z552"  (similar sound pattern)
 */
export function soundex(str) {
  const s = str.toLowerCase().replace(/[^a-z]/g, '')
  if (!s) return '0000'
  
  const firstLetter = s[0].toUpperCase()
  
  // Soundex character mappings
  const soundexMap = {
    'b': '1', 'f': '1', 'p': '1', 'v': '1',
    'c': '2', 'g': '2', 'j': '2', 'k': '2', 'q': '2', 's': '2', 'x': '2', 'z': '2',
    'd': '3', 't': '3',
    'l': '4',
    'm': '5', 'n': '5',
    'r': '6'
  }
  
  let code = firstLetter
  let prevCode = soundexMap[s[0]] || '0'
  
  for (let i = 1; i < s.length && code.length < 4; i++) {
    const currentCode = soundexMap[s[i]] || '0'
    if (currentCode !== '0' && currentCode !== prevCode) {
      code += currentCode
    }
    prevCode = currentCode
  }
  
  // Pad with zeros
  return (code + '0000').substring(0, 4)
}

/**
 * Metaphone algorithm - more advanced phonetic encoding
 * Better for English pronunciation
 */
export function metaphone(str) {
  const word = str.toLowerCase().replace(/[^a-z]/g, '')
  if (!word) return ''
  
  let result = ''
  let current = 0
  
  // Simplified metaphone implementation
  const rules = {
    'ph': 'f',
    'gh': 'g',
    'gn': 'n',
    'kn': 'n',
    'ps': 's',
    'wr': 'r',
    'mb': 'm',
    'ck': 'k',
    'ch': 'x',
    'sh': 'x',
    'th': '0',
    'wh': 'w'
  }
  
  let i = 0
  while (i < word.length) {
    let found = false
    
    // Check two-letter combinations
    if (i < word.length - 1) {
      const twoChar = word.substring(i, i + 2)
      if (rules[twoChar]) {
        result += rules[twoChar]
        i += 2
        found = true
      }
    }
    
    if (!found) {
      const char = word[i]
      // Vowels are only kept if at start
      if (i === 0 || !'aeiou'.includes(char)) {
        result += char
      }
      i++
    }
  }
  
  return result.substring(0, 8) // Limit length
}

/**
 * Check if two strings sound similar
 */
export function soundsLike(str1, str2) {
  const soundex1 = soundex(str1)
  const soundex2 = soundex(str2)
  const metaphone1 = metaphone(str1)
  const metaphone2 = metaphone(str2)
  
  return soundex1 === soundex2 || metaphone1 === metaphone2
}

/**
 * Damerau-Levenshtein distance - includes transpositions
 * "zamsung" vs "samsung" - transposition of 'm' and 's'
 */
export function damerauLevenshteinDistance(str1, str2) {
  const s1 = str1.toLowerCase()
  const s2 = str2.toLowerCase()
  const len1 = s1.length
  const len2 = s2.length
  
  const h = Array(len1 + 2).fill(null).map(() => Array(len2 + 2).fill(0))
  const inf = len1 + len2
  h[0][0] = inf
  
  for (let i = 0; i <= len1; i++) {
    h[i + 1][0] = inf
    h[i + 1][1] = i
  }
  
  for (let j = 0; j <= len2; j++) {
    h[0][j + 1] = inf
    h[1][j + 1] = j
  }
  
  const da = {}
  const chars = (s1 + s2).split('')
  chars.forEach(ch => { da[ch] = 0 })
  
  for (let i = 1; i <= len1; i++) {
    let db = 0
    for (let j = 1; j <= len2; j++) {
      const k = da[s2[j - 1]]
      const l = db
      let cost = 1
      
      if (s1[i - 1] === s2[j - 1]) {
        cost = 0
        db = j
      }
      
      h[i + 1][j + 1] = Math.min(
        h[i][j] + cost,           // substitution
        h[i + 1][j] + 1,          // insertion
        h[i][j + 1] + 1,          // deletion
        h[k][l] + (i - k - 1) + 1 + (j - l - 1) // transposition
      )
    }
    da[s1[i - 1]] = i
  }
  
  return h[len1 + 1][len2 + 1]
}

/**
 * N-gram similarity - break strings into sequences and compare
 */
export function nGramSimilarity(str1, str2, n = 2) {
  const s1 = str1.toLowerCase()
  const s2 = str2.toLowerCase()
  
  const getNGrams = (str, size) => {
    const ngrams = new Set()
    for (let i = 0; i <= str.length - size; i++) {
      ngrams.add(str.substring(i, i + size))
    }
    return ngrams
  }
  
  const ngrams1 = getNGrams(s1, n)
  const ngrams2 = getNGrams(s2, n)
  
  const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)))
  const union = new Set([...ngrams1, ...ngrams2])
  
  return union.size === 0 ? 0 : intersection.size / union.size
}

/**
 * Comprehensive fuzzy match score
 * Returns a score from 0 to 100
 */
export function fuzzyMatchScore(query, target) {
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  
  // Exact match
  if (q === t) return 100
  
  // Starts with match
  if (t.startsWith(q)) return 95
  
  // Contains match
  if (t.includes(q)) return 85
  
  // Calculate various similarity metrics
  const levenshtein = similarityRatio(q, t)
  const damerau = 1 - (damerauLevenshteinDistance(q, t) / Math.max(q.length, t.length))
  const ngram2 = nGramSimilarity(q, t, 2)
  const ngram3 = nGramSimilarity(q, t, 3)
  const phonetic = soundsLike(q, t) ? 1 : 0
  
  // Weighted average of different metrics
  const score = (
    levenshtein * 30 +
    damerau * 25 +
    ngram2 * 20 +
    ngram3 * 15 +
    phonetic * 10
  )
  
  return Math.round(score)
}

/**
 * Find fuzzy matches for a query in a list of options
 * Returns matches sorted by score (best first)
 */
export function findFuzzyMatches(query, options, threshold = 60) {
  const matches = options
    .map(option => ({
      value: option,
      score: fuzzyMatchScore(query, option)
    }))
    .filter(match => match.score >= threshold)
    .sort((a, b) => b.score - a.score)
  
  return matches
}

/**
 * Common typo patterns for keyboard proximity
 */
export function getKeyboardProximityVariations(str) {
  const proximityMap = {
    'a': ['q', 's', 'w', 'z'],
    'b': ['v', 'g', 'h', 'n'],
    'c': ['x', 'd', 'f', 'v'],
    'd': ['s', 'e', 'f', 'c', 'x'],
    'e': ['w', 'r', 'd', 's'],
    'f': ['d', 'r', 'g', 'c', 'v'],
    'g': ['f', 't', 'h', 'b', 'v'],
    'h': ['g', 'y', 'j', 'n', 'b'],
    'i': ['u', 'o', 'k', 'j'],
    'j': ['h', 'u', 'k', 'm', 'n'],
    'k': ['j', 'i', 'l', 'm'],
    'l': ['k', 'o', 'p'],
    'm': ['n', 'j', 'k'],
    'n': ['b', 'h', 'j', 'm'],
    'o': ['i', 'p', 'l', 'k'],
    'p': ['o', 'l'],
    'q': ['w', 'a'],
    'r': ['e', 't', 'f', 'd'],
    's': ['a', 'w', 'd', 'x', 'z'],
    't': ['r', 'y', 'g', 'f'],
    'u': ['y', 'i', 'j', 'h'],
    'v': ['c', 'f', 'g', 'b'],
    'w': ['q', 'e', 's', 'a'],
    'x': ['z', 's', 'd', 'c'],
    'y': ['t', 'u', 'h', 'g'],
    'z': ['a', 's', 'x']
  }
  
  const variations = new Set([str])
  const chars = str.toLowerCase().split('')
  
  // Generate single-character proximity variations
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]
    const nearby = proximityMap[char] || []
    
    nearby.forEach(nearbyChar => {
      const variation = chars.slice()
      variation[i] = nearbyChar
      variations.add(variation.join(''))
    })
  }
  
  return Array.from(variations)
}

/**
 * Generate common typo variations
 */
export function generateTypoVariations(word) {
  const variations = new Set([word])
  const w = word.toLowerCase()
  
  // Double letters (samssung)
  for (let i = 0; i < w.length; i++) {
    variations.add(w.substring(0, i) + w[i] + w.substring(i))
  }
  
  // Missing letters (samsng)
  for (let i = 0; i < w.length; i++) {
    variations.add(w.substring(0, i) + w.substring(i + 1))
  }
  
  // Transposed letters (samsugn)
  for (let i = 0; i < w.length - 1; i++) {
    const chars = w.split('')
    const temp = chars[i]
    chars[i] = chars[i + 1]
    chars[i + 1] = temp
    variations.add(chars.join(''))
  }
  
  // Common vowel substitutions
  const vowelSubs = {
    'a': ['e', 'o'],
    'e': ['a', 'i'],
    'i': ['e', 'y'],
    'o': ['a', 'u'],
    'u': ['o', 'i']
  }
  
  for (let i = 0; i < w.length; i++) {
    const char = w[i]
    if (vowelSubs[char]) {
      vowelSubs[char].forEach(sub => {
        variations.add(w.substring(0, i) + sub + w.substring(i + 1))
      })
    }
  }
  
  return Array.from(variations)
}

/**
 * Main fuzzy search function - combines all strategies
 */
export function fuzzySearch(query, dataset, options = {}) {
  const {
    threshold = 60,
    maxResults = 10,
    includeScore = false
  } = options
  
  const matches = findFuzzyMatches(query, dataset, threshold)
  
  const results = matches.slice(0, maxResults)
  
  return includeScore ? results : results.map(r => r.value)
}