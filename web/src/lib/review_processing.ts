import { Review, ReviewAnalysis, ReviewFlag } from "../types/review";

// Simulated ML model responses - in production, these would call actual ML APIs
class ReviewMLProcessor {
  private spamKeywords = [
    "click here",
    "visit my",
    "check out",
    "amazing deal",
    "limited time",
    "call now",
    "free money",
    "guaranteed",
    "act now",
    "special offer",
  ];

  private advertisementPatterns = [
    /\b(buy|purchase|sale|discount|promo|coupon)\b/gi,
    /\b(www\.|http|\.com|\.net|\.org)\b/gi,
    /\b(phone|call|contact)\s*:?\s*\d/gi,
    /\b(email|e-mail)\s*:?\s*\S+@\S+/gi,
  ];

  private irrelevantIndicators = [
    "nothing to do with",
    "wrong place",
    "different location",
    "not about this",
    "unrelated",
    "off topic",
  ];

  private nonVisitorRantPatterns = [
    /never (been|visited|went)/gi,
    /haven't (been|visited|gone)/gi,
    /without (going|visiting)/gi,
    /based on (photos|reviews|website)/gi,
  ];


  private detectSpam(content: string): number {
    const lowerContent = content.toLowerCase();
    let spamScore = 0;

    // Check for spam keywords
    const keywordMatches = this.spamKeywords.filter((keyword) =>
      lowerContent.includes(keyword.toLowerCase()),
    ).length;
    spamScore += (keywordMatches / this.spamKeywords.length) * 0.4;

    // Check for excessive capitalization
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.3) spamScore += 0.3;

    // Check for excessive punctuation
    const punctRatio = (content.match(/[!?]{2,}/g) || []).length;
    if (punctRatio > 2) spamScore += 0.2;

    // Check for very short or very repetitive content
    if (content.length < 10) spamScore += 0.3;

    const words = content.split(/\s+/);
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
    if (words.length > 5 && uniqueWords.size / words.length < 0.5) {
      spamScore += 0.2;
    }

    return Math.min(spamScore, 1);
  }

  private detectAdvertisement(content: string): number {
    let adScore = 0;

    // Check for advertisement patterns
    this.advertisementPatterns.forEach((pattern) => {
      if (pattern.test(content)) {
        adScore += 0.25;
      }
    });

    // Check for promotional language
    const promoWords = [
      "best",
      "amazing",
      "incredible",
      "must try",
      "highly recommend",
    ];
    const promoCount = promoWords.filter((word) =>
      content.toLowerCase().includes(word),
    ).length;
    adScore += (promoCount / promoWords.length) * 0.3;

    // Check for contact information
    if (/\d{3}[-.]?\d{3}[-.]?\d{4}/.test(content)) adScore += 0.4;
    if (/@\w+\.\w+/.test(content)) adScore += 0.3;

    return Math.min(adScore, 1);
  }

  private assessRelevancy(review: Review): number {
    const content = review.content.toLowerCase();
    let relevancyScore = 0.5; // Base score

    // Check for irrelevant indicators
    const irrelevantCount = this.irrelevantIndicators.filter((indicator) =>
      content.includes(indicator.toLowerCase()),
    ).length;
    relevancyScore -= irrelevantCount * 0.2;

    // Positive indicators of relevancy
    const locationWords = [
      "location",
      "place",
      "here",
      "there",
      "visit",
      "went",
      "experience",
    ];
    const locationCount = locationWords.filter((word) =>
      content.includes(word),
    ).length;
    relevancyScore += (locationCount / locationWords.length) * 0.3;

    // Check if review mentions specific aspects of the business
    const businessAspects = [
      "service",
      "staff",
      "food",
      "atmosphere",
      "price",
      "quality",
      "clean",
    ];
    const aspectCount = businessAspects.filter((aspect) =>
      content.includes(aspect),
    ).length;
    relevancyScore += (aspectCount / businessAspects.length) * 0.4;

    // Length consideration - very short reviews are often less relevant
    if (review.content.length < 20) relevancyScore -= 0.2;
    if (review.content.length > 100) relevancyScore += 0.1;

    return Math.max(0, Math.min(1, relevancyScore));
  }

  private assessVisitLikelihood(review: Review): number {
    let visitScore = 0.5; // Base assumption

    // Check for non-visitor patterns
    const nonVisitorMatches = this.nonVisitorRantPatterns.filter((pattern) =>
      pattern.test(review.content),
    ).length;
    visitScore -= nonVisitorMatches * 0.3;

    // Positive visit indicators
    const visitIndicators = [
      /\b(went|visited|been|was there|stopped by)\b/gi,
      /\b(ordered|ate|tried|bought)\b/gi,
      /\b(waited|sat|stood|walked)\b/gi,
    ];

    visitIndicators.forEach((pattern) => {
      if (pattern.test(review.content)) {
        visitScore += 0.2;
      }
    });

    // Metadata indicators
    if (review.metadata?.photos && review.metadata.photos.length > 0) {
      visitScore += 0.3;
    }

    if (review.metadata?.visitDuration && review.metadata.visitDuration > 0) {
      visitScore += 0.2;
    }

    // Detailed reviews are more likely from actual visitors
    if (review.content.length > 150) visitScore += 0.1;

    return Math.max(0, Math.min(1, visitScore));
  }

  private calculateQualityScore(factors: {
    spamScore: number;
    adScore: number;
    relevancyScore: number;
    visitLikelihood: number;
    contentLength: number;
    hasMetadata: boolean;
  }): number {
    const weights = {
      spam: 0.25,
      ad: 0.2,
      relevancy: 0.25,
      visit: 0.15,
      length: 0.1,
      metadata: 0.05,
    };

    let score = 0;
    score += factors.spamScore * weights.spam;
    score += factors.adScore * weights.ad;
    score += factors.relevancyScore * weights.relevancy;
    score += factors.visitLikelihood * weights.visit;

    // Length factor (optimal around 100-300 characters)
    const lengthFactor =
      factors.contentLength < 50
        ? 0.3
        : factors.contentLength > 500
          ? 0.7
          : Math.min(1, factors.contentLength / 200);
    score += lengthFactor * weights.length;

    score += (factors.hasMetadata ? 1 : 0.5) * weights.metadata;

    return Math.max(0, Math.min(1, score));
  }

  private calculateConfidence(flags: ReviewFlag[], review: Review): number {
    let confidence = 0.7; // Base confidence

    // Higher confidence with more data
    if (review.metadata?.photos && review.metadata.photos.length > 0)
      confidence += 0.1;
    if (review.content.length > 100) confidence += 0.1;
    if (review.metadata?.visitDuration) confidence += 0.05;

    // Lower confidence with conflicting signals
    const highSeverityFlags = flags.filter((f) => f.severity === "high").length;
    confidence -= highSeverityFlags * 0.05;

    return Math.max(0.1, Math.min(1, confidence));
  }
}



