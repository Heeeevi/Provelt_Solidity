/**
 * Share Utilities
 * Native share API with fallback to clipboard
 */

export interface ShareData {
  title: string;
  text: string;
  url: string;
}

/**
 * Check if native share is supported
 */
export function canShare(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share;
}

/**
 * Share content using native share API or fallback to clipboard
 */
export async function shareContent(data: ShareData): Promise<{ success: boolean; method: 'native' | 'clipboard' }> {
  // Try native share first
  if (canShare()) {
    try {
      await navigator.share(data);
      return { success: true, method: 'native' };
    } catch (error: any) {
      // User cancelled or share failed
      if (error.name === 'AbortError') {
        return { success: false, method: 'native' };
      }
      // Fall through to clipboard
    }
  }
  
  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(data.url);
    return { success: true, method: 'clipboard' };
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return { success: false, method: 'clipboard' };
  }
}

/**
 * Generate share URL for a submission
 */
export function getSubmissionShareUrl(submissionId: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'https://provelt.app';
  return `${baseUrl}/submission/${submissionId}`;
}

/**
 * Generate share URL for a challenge
 */
export function getChallengeShareUrl(challengeId: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'https://provelt.app';
  return `${baseUrl}/challenges/${challengeId}`;
}

/**
 * Generate share URL for a profile
 */
export function getProfileShareUrl(profileId: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'https://provelt.app';
  return `${baseUrl}/profile/${profileId}`;
}

/**
 * Share a submission
 */
export async function shareSubmission(
  submissionId: string, 
  challengeTitle: string,
  username?: string
): Promise<{ success: boolean; method: 'native' | 'clipboard' }> {
  const url = getSubmissionShareUrl(submissionId);
  const text = username 
    ? `Check out ${username}'s proof for "${challengeTitle}" on PROVELT! 🏆`
    : `Check out this proof for "${challengeTitle}" on PROVELT! 🏆`;
  
  return shareContent({
    title: `${challengeTitle} - PROVELT`,
    text,
    url,
  });
}

/**
 * Share a challenge
 */
export async function shareChallenge(
  challengeId: string,
  title: string,
  points: number
): Promise<{ success: boolean; method: 'native' | 'clipboard' }> {
  const url = getChallengeShareUrl(challengeId);
  
  return shareContent({
    title: `${title} - PROVELT Challenge`,
    text: `Can you complete this challenge? "${title}" - Earn ${points} points and an NFT badge! 🎯`,
    url,
  });
}

/**
 * Share a profile
 */
export async function shareProfile(
  profileId: string,
  displayName: string,
  badgesCount: number
): Promise<{ success: boolean; method: 'native' | 'clipboard' }> {
  const url = getProfileShareUrl(profileId);
  
  return shareContent({
    title: `${displayName} on PROVELT`,
    text: `Check out ${displayName}'s profile on PROVELT! ${badgesCount} badges earned 🏅`,
    url,
  });
}

/**
 * Generate Twitter/X share URL
 */
export function getTwitterShareUrl(text: string, url: string): string {
  const params = new URLSearchParams({
    text,
    url,
  });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * Generate Telegram share URL
 */
export function getTelegramShareUrl(text: string, url: string): string {
  const params = new URLSearchParams({
    url,
    text,
  });
  return `https://t.me/share/url?${params.toString()}`;
}

/**
 * Generate WhatsApp share URL
 */
export function getWhatsAppShareUrl(text: string, url: string): string {
  const fullText = `${text}\n\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(fullText)}`;
}
