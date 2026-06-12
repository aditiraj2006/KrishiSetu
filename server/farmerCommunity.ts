import { z } from "zod";

// Community Content Schemas
export const forumPostSchema = z.object({
  id: z.string().default(() => Date.now().toString()),
  author_id: z.string().min(1, "Author ID is required"),
  author_name: z.string().min(1, "Author name is required"),
  category: z.enum(["crop", "region", "problem"], {
    errorMap: () => ({ message: "Category must be crop, region, or problem" }),
  }),
  topic: z.string().min(1, "Topic is required"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(20, "Content must be at least 20 characters"),
  tags: z.array(z.string()).default([]),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
  view_count: z.number().default(0),
  reply_count: z.number().default(0),
  is_pinned: z.boolean().default(false),
  status: z.enum(["active", "archived"]).default("active"),
});

export const discussionReplySchema = z.object({
  id: z.string().default(() => Date.now().toString()),
  post_id: z.string().min(1, "Post ID is required"),
  author_id: z.string().min(1, "Author ID is required"),
  author_name: z.string().min(1, "Author name is required"),
  content: z.string().min(10, "Reply must be at least 10 characters"),
  helpful_count: z.number().default(0),
  is_verified_answer: z.boolean().default(false),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
});

export const experiencePostSchema = z.object({
  id: z.string().default(() => Date.now().toString()),
  author_id: z.string().min(1, "Author ID is required"),
  author_name: z.string().min(1, "Author name is required"),
  crop: z.string().min(1, "Crop name is required"),
  region: z.string().min(1, "Region is required"),
  technique: z.string().min(1, "Technique name is required"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  results: z.string().min(20, "Results description required"),
  yield_improvement: z.number().optional(),
  cost_savings: z.number().optional(),
  difficulty_level: z.enum(["easy", "medium", "hard"]).default("medium"),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  created_at: z.date().default(() => new Date()),
  upvote_count: z.number().default(0),
  downvote_count: z.number().default(0),
  adoption_count: z.number().default(0),
});

export const bestPracticeSchema = z.object({
  id: z.string().default(() => Date.now().toString()),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(50, "Description required"),
  crop: z.string().optional(),
  region: z.string().optional(),
  category: z.enum(["fertilization", "pest-control", "irrigation", "harvesting", "storage"], {
    errorMap: () => ({ message: "Invalid category" }),
  }),
  steps: z.array(z.object({
    order: z.number(),
    title: z.string(),
    description: z.string(),
  })),
  expected_benefits: z.array(z.string()),
  source_posts: z.array(z.string()).default([]),
  verified_by: z.array(z.string()).default([]),
  verification_count: z.number().default(0),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
});

export type ForumPost = z.infer<typeof forumPostSchema>;
export type DiscussionReply = z.infer<typeof discussionReplySchema>;
export type ExperiencePost = z.infer<typeof experiencePostSchema>;
export type BestPractice = z.infer<typeof bestPracticeSchema>;

// Farmer Community Service
class FarmerCommunityService {
  private forums: Map<string, ForumPost[]> = new Map();
  private replies: Map<string, DiscussionReply[]> = new Map();
  private experiences: Map<string, ExperiencePost[]> = new Map();
  private bestPractices: Map<string, BestPractice[]> = new Map();
  private userReputation: Map<string, number> = new Map();

  /**
   * Create a new forum discussion
   */
  async createForumPost(postData: Omit<ForumPost, "id" | "created_at" | "updated_at" | "view_count" | "reply_count">): Promise<ForumPost> {
    const post = forumPostSchema.parse(postData);

    const key = `forum-${post.category}-${post.topic}`;
    if (!this.forums.has(key)) {
      this.forums.set(key, []);
    }

    this.forums.get(key)!.push(post);

    // Award reputation points to poster
    this.addReputationPoints(post.author_id, 10);

    return post;
  }

  /**
   * Get forum discussions by category and topic
   */
  async getForumDiscussions(category: string, topic?: string): Promise<ForumPost[]> {
    const discussions: ForumPost[] = [];

    for (const [key, posts] of this.forums.entries()) {
      if (key.includes(category)) {
        if (!topic || key.includes(topic)) {
          discussions.push(...posts.filter((p) => p.status === "active"));
        }
      }
    }

    // Sort by pinned status and creation date
    return discussions.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) {
        return b.is_pinned ? 1 : -1;
      }
      return b.created_at.getTime() - a.created_at.getTime();
    });
  }

  /**
   * Add reply to forum discussion
   */
  async addDiscussionReply(reply: Omit<DiscussionReply, "id" | "created_at" | "updated_at">): Promise<DiscussionReply> {
    const replyData = discussionReplySchema.parse(reply);

    if (!this.replies.has(replyData.post_id)) {
      this.replies.set(replyData.post_id, []);
    }

    this.replies.get(replyData.post_id)!.push(replyData);

    // Award reputation for helpful reply
    if (replyData.helpful_count > 5) {
      this.addReputationPoints(replyData.author_id, 5);
    }

    return replyData;
  }

  /**
   * Mark answer as verified (only for experienced farmers)
   */
  async verifyAnswer(postId: string, replyId: string, userId: string): Promise<boolean> {
    // Check if user has high reputation (experienced farmer)
    const reputation = this.userReputation.get(userId) || 0;
    if (reputation < 50) {
      throw new Error("Insufficient reputation to verify answers");
    }

    const replies = this.replies.get(postId);
    if (!replies) return false;

    const reply = replies.find((r) => r.id === replyId);
    if (reply) {
      reply.is_verified_answer = true;
      this.addReputationPoints(reply.author_id, 20); // Bonus for verified answer
      return true;
    }

    return false;
  }

  /**
   * Share farming experience and success stories
   */
  async shareExperience(experience: Omit<ExperiencePost, "id" | "created_at" | "upvote_count" | "downvote_count" | "adoption_count">): Promise<ExperiencePost> {
    const experiencePost = experiencePostSchema.parse(experience);

    const key = `${experiencePost.crop}-${experiencePost.region}`;
    if (!this.experiences.has(key)) {
      this.experiences.set(key, []);
    }

    this.experiences.get(key)!.push(experiencePost);

    // Award reputation for sharing
    this.addReputationPoints(experiencePost.author_id, 15);

    return experiencePost;
  }

  /**
   * Get success stories filtered by crop and region
   */
  async getSuccessStories(crop?: string, region?: string): Promise<ExperiencePost[]> {
    const stories: ExperiencePost[] = [];

    for (const posts of this.experiences.values()) {
      stories.push(
        ...posts.filter((p) => {
          if (crop && p.crop.toLowerCase() !== crop.toLowerCase()) return false;
          if (region && p.region.toLowerCase() !== region.toLowerCase()) return false;
          return true;
        }),
      );
    }

    // Sort by adoption count and upvotes
    return stories.sort((a, b) => {
      const aScore = a.adoption_count + a.upvote_count;
      const bScore = b.adoption_count + b.upvote_count;
      return bScore - aScore;
    });
  }

  /**
   * Curate best practices from community discussions
   */
  async createBestPractice(practiceData: Omit<BestPractice, "id" | "created_at" | "updated_at" | "verification_count">): Promise<BestPractice> {
    const practice = bestPracticeSchema.parse(practiceData);

    const key = `best-practices-${practice.category}`;
    if (!this.bestPractices.has(key)) {
      this.bestPractices.set(key, []);
    }

    this.bestPractices.get(key)!.push(practice);

    return practice;
  }

  /**
   * Get best practices by category
   */
  async getBestPractices(category: string, crop?: string, region?: string): Promise<BestPractice[]> {
    const key = `best-practices-${category}`;
    const practices = this.bestPractices.get(key) || [];

    return practices.filter((p) => {
      if (crop && p.crop && p.crop.toLowerCase() !== crop.toLowerCase()) return false;
      if (region && p.region && p.region.toLowerCase() !== region.toLowerCase()) return false;
      return true;
    });
  }

  /**
   * Verify best practice (improves credibility)
   */
  async verifyBestPractice(practiceId: string, userId: string): Promise<boolean> {
    const reputation = this.userReputation.get(userId) || 0;
    if (reputation < 100) {
      throw new Error("Insufficient reputation to verify best practices");
    }

    for (const practices of this.bestPractices.values()) {
      const practice = practices.find((p) => p.id === practiceId);
      if (practice) {
        if (!practice.verified_by.includes(userId)) {
          practice.verified_by.push(userId);
          practice.verification_count++;
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Find regional experts for farmer connections
   */
  async findRegionalExperts(region: string, topic?: string): Promise<Array<{
    user_id: string;
    name: string;
    reputation: number;
    expertise_count: number;
    success_stories: number;
  }>> {
    const experts: Map<string, any> = new Map();

    // Analyze farmer contributions in region
    for (const posts of this.experiences.values()) {
      for (const post of posts) {
        if (post.region.toLowerCase() === region.toLowerCase()) {
          if (!experts.has(post.author_id)) {
            experts.set(post.author_id, {
              user_id: post.author_id,
              name: post.author_name,
              reputation: this.userReputation.get(post.author_id) || 0,
              expertise_count: 0,
              success_stories: 0,
            });
          }
          const expert = experts.get(post.author_id);
          expert.expertise_count++;
          if (post.adoption_count > 5) {
            expert.success_stories++;
          }
        }
      }
    }

    return Array.from(experts.values()).sort((a, b) => b.reputation - a.reputation);
  }

  /**
   * Get farmer reputation and achievements
   */
  async getFarmerProfile(userId: string): Promise<{
    user_id: string;
    reputation: number;
    discussions_created: number;
    helpful_replies: number;
    experiences_shared: number;
    verified_practices: number;
    achievements: string[];
  }> {
    const reputation = this.userReputation.get(userId) || 0;

    let discussionsCreated = 0;
    let helpfulReplies = 0;
    let experiencesShared = 0;
    let verifiedPractices = 0;

    // Count contributions
    for (const posts of this.forums.values()) {
      discussionsCreated += posts.filter((p) => p.author_id === userId).length;
    }

    for (const replies of this.replies.values()) {
      helpfulReplies += replies.filter((r) => r.author_id === userId && r.is_verified_answer).length;
    }

    for (const experiences of this.experiences.values()) {
      experiencesShared += experiences.filter((e) => e.author_id === userId).length;
    }

    for (const practices of this.bestPractices.values()) {
      verifiedPractices += practices.filter((p) => p.verified_by.includes(userId)).length;
    }

    // Determine achievements
    const achievements = [];
    if (reputation >= 50) achievements.push("Expert");
    if (experiencesShared >= 5) achievements.push("Story Teller");
    if (helpfulReplies >= 10) achievements.push("Helpful");
    if (verifiedPractices >= 5) achievements.push("Validator");

    return {
      user_id: userId,
      reputation,
      discussions_created: discussionsCreated,
      helpful_replies: helpfulReplies,
      experiences_shared: experiencesShared,
      verified_practices: verifiedPractices,
      achievements,
    };
  }

  /**
   * Award reputation points to farmer
   */
  private addReputationPoints(userId: string, points: number): void {
    const current = this.userReputation.get(userId) || 0;
    this.userReputation.set(userId, current + points);
  }

  /**
   * Search discussions by keywords
   */
  async searchDiscussions(query: string): Promise<ForumPost[]> {
    const results: ForumPost[] = [];

    for (const posts of this.forums.values()) {
      results.push(
        ...posts.filter((p) => {
          const searchStr = `${p.title} ${p.content}`.toLowerCase();
          return searchStr.includes(query.toLowerCase());
        }),
      );
    }

    return results;
  }
}

export const farmerCommunityService = new FarmerCommunityService();
