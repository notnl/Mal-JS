export interface Review {
  id: string;
  javaFile: string;
  content: string;
  timestamp: Date;
  metadata?: {
    deviceInfo?: string;
    location?: {
      lat: number;
      lng: number;
    };
    visitDuration?: number;
    photos?: string[];
  };
}

export interface ReviewAnalysis {
  reviewId: string;
  qualityScore: number; // 0-100, higher is better quality
  relevancyScore: number; // 0-100, higher is more relevant
  spamProbability: number; // 0-1, higher means more likely spam
  advertisementProbability: number; // 0-1, higher means more likely ad
  visitLikelihood: number; // 0-1, higher means more likely visited
  flags: ReviewFlag[];
  confidence: number; // 0-1, confidence in the analysis
  processedAt: Date;
}

export interface ReviewFlag {
  type:
    | "spam"
    | "advertisement"
    | "irrelevant"
    | "non_visitor_rant"
    | "policy_violation";
  severity: "low" | "medium" | "high";
  reason: string;
  confidence: number;
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  threshold: number;
  action: "flag" | "hide" | "remove";
}

export interface ReviewProcessingResult {
  review: Review;
  action: "approve" | "flag" | "reject";
  reason?: string;
}
