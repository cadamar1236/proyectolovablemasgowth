// Rate limiting utility for voting
// Prevents abuse and protects database from excessive writes

const VOTE_RATE_LIMIT_SECONDS = 5; // 1 vote per 5 seconds per user

export async function checkVoteRateLimit(
  cache: KVNamespace | undefined,
  userId: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  if (!cache) {
    // If cache not available, allow (graceful degradation)
    return { allowed: true };
  }

  const rateLimitKey = `vote_rate_limit:${userId}`;
  
  try {
    const lastVoteTime = await cache.get(rateLimitKey);
    
    if (lastVoteTime) {
      const timeSinceLastVote = Date.now() - parseInt(lastVoteTime);
      const remainingTime = (VOTE_RATE_LIMIT_SECONDS * 1000) - timeSinceLastVote;
      
      if (remainingTime > 0) {
        return {
          allowed: false,
          retryAfter: Math.ceil(remainingTime / 1000)
        };
      }
    }
    
    // Update last vote time
    await cache.put(rateLimitKey, Date.now().toString(), {
      expirationTtl: VOTE_RATE_LIMIT_SECONDS
    });
    
    return { allowed: true };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // On error, allow (fail open)
    return { allowed: true };
  }
}
