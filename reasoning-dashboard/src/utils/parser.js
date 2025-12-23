// Parser utilities for extracting structured data from model responses

export function parseThinkerResponse(rawText) {
  const reasoningTypes = ['deductive', 'causal', 'probabilistic', 'mathematical', 'commonsense'];
  
  // Try to detect reasoning type from content
  let reasoningType = 'commonsense'; // default
  const lowerText = rawText.toLowerCase();
  if (lowerText.includes('math') || lowerText.includes('calculate') || lowerText.includes('equation')) {
    reasoningType = 'mathematical';
  } else if (lowerText.includes('cause') || lowerText.includes('effect') || lowerText.includes('because')) {
    reasoningType = 'causal';
  } else if (lowerText.includes('probability') || lowerText.includes('likely') || lowerText.includes('chance')) {
    reasoningType = 'probabilistic';
  } else if (lowerText.includes('deduce') || lowerText.includes('therefore') || lowerText.includes('logically')) {
    reasoningType = 'deductive';
  }

  return {
    internal: true,
    reasoning_type: reasoningType,
    raw: rawText.trim()
  };
}

export function parseCriticResponse(rawText) {
  return {
    internal: true,
    raw: rawText.trim()
  };
}

export function parseJudgeResponse(rawText) {
  // Extract User Facing Answer (between ## User Facing Answer and ## Reasoning)
  const userFacingMatch = rawText.match(/## User Facing Answer\s*([\s\S]+?)(?=## Reasoning|$)/i);
  const userFacingAnswer = userFacingMatch ? userFacingMatch[1].trim() : rawText.trim();
  
  // Extract Judge's Reasoning (everything after ## Reasoning)
  const reasoningMatch = rawText.match(/## Reasoning\s*([\s\S]+?)$/i);
  const judgeReasoning = reasoningMatch ? reasoningMatch[1].trim() : '';

  return {
    final_answer: userFacingAnswer,
    judge_reasoning: judgeReasoning || 'No reasoning provided'
  };
}

export function generateQueryId() {
  return `q-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
}

