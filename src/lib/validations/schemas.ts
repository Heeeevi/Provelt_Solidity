/**
 * PROVELT Zod Validation Schemas
 * Comprehensive validation for all database entities
 */

import { z } from 'zod';

// ============================================
// ENUM SCHEMAS
// ============================================

export const DifficultyLevelSchema = z.enum(['easy', 'medium', 'hard', 'expert']);
export type DifficultyLevel = z.infer<typeof DifficultyLevelSchema>;

export const MediaTypeSchema = z.enum(['image', 'video', 'text']);
export type MediaType = z.infer<typeof MediaTypeSchema>;

export const SubmissionStatusSchema = z.enum(['pending', 'approved', 'rejected', 'flagged']);
export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;

export const ChallengeCategorySchema = z.enum([
  'coding',
  'design',
  'fitness',
  'music',
  'art',
  'cooking',
  'language',
  'productivity',
  'mindfulness',
  'other',
]);
export type ChallengeCategory = z.infer<typeof ChallengeCategorySchema>;

export const ReactionTypeSchema = z.enum(['like', 'fire', 'clap', 'mindblown', 'heart']);
export type ReactionType = z.infer<typeof ReactionTypeSchema>;

// ============================================
// PROFILE SCHEMAS
// ============================================

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .nullable(),
  display_name: z.string().max(100).nullable(),
  avatar_url: z.string().url().nullable(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').nullable(),
  wallet_address: z.string().nullable(),
  total_points: z.number().int().nonnegative().default(0),
  badges_count: z.number().int().nonnegative().default(0),
  submissions_count: z.number().int().nonnegative().default(0),
  streak_days: z.number().int().nonnegative().default(0),
  longest_streak: z.number().int().nonnegative().default(0),
  is_public: z.boolean().default(true),
  notifications_enabled: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  last_active_at: z.string().datetime(),
});

export type Profile = z.infer<typeof ProfileSchema>;

// Schema for creating/updating profile
export const ProfileUpdateSchema = ProfileSchema.pick({
  username: true,
  display_name: true,
  bio: true,
  is_public: true,
  notifications_enabled: true,
}).partial();

export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;

// Schema for linking wallet
export const LinkWalletSchema = z.object({
  wallet_address: z
    .string()
    .min(32, 'Invalid wallet address')
    .max(44, 'Invalid wallet address'),
});

export type LinkWallet = z.infer<typeof LinkWalletSchema>;

// ============================================
// CHALLENGE SCHEMAS
// ============================================

export const ChallengeSchema = z.object({
  id: z.string().uuid(),
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be at most 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  instructions: z.string().nullable(),
  difficulty: DifficultyLevelSchema,
  category: ChallengeCategorySchema,
  tags: z.array(z.string()).default([]),
  points: z.number().int().positive('Points must be positive'),
  badge_image_url: z.string().url().nullable(),
  badge_name: z.string().nullable(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  submissions_count: z.number().int().nonnegative().default(0),
  completions_count: z.number().int().nonnegative().default(0),
  created_by: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Challenge = z.infer<typeof ChallengeSchema>;

// Schema for creating a challenge (admin only)
export const ChallengeCreateSchema = ChallengeSchema.omit({
  id: true,
  submissions_count: true,
  completions_count: true,
  created_at: true,
  updated_at: true,
}).extend({
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
}).refine((data) => new Date(data.ends_at) > new Date(data.starts_at), {
  message: 'End date must be after start date',
  path: ['ends_at'],
});

export type ChallengeCreate = z.infer<typeof ChallengeCreateSchema>;

// ============================================
// SUBMISSION SCHEMAS
// ============================================

export const SubmissionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  challenge_id: z.string().uuid(),
  media_url: z.string().url().nullable(),
  media_type: MediaTypeSchema,
  text_content: z.string().nullable(),
  caption: z.string().max(500, 'Caption must be at most 500 characters').nullable(),
  status: SubmissionStatusSchema.default('pending'),
  rejection_reason: z.string().nullable(),
  nft_mint_address: z.string().nullable(),
  nft_metadata_uri: z.string().url().nullable(),
  nft_tx_signature: z.string().nullable(),
  minted_at: z.string().datetime().nullable(),
  reactions_count: z.number().int().nonnegative().default(0),
  comments_count: z.number().int().nonnegative().default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Submission = z.infer<typeof SubmissionSchema>;

// Schema for creating a submission
export const SubmissionCreateSchema = z.object({
  challenge_id: z.string().uuid(),
  media_type: MediaTypeSchema,
  media_url: z.string().url().optional(),
  text_content: z.string().min(10, 'Text content must be at least 10 characters').optional(),
  caption: z.string().max(500).optional(),
}).refine(
  (data) => {
    if (data.media_type === 'text') {
      return !!data.text_content;
    }
    return !!data.media_url;
  },
  {
    message: 'Text submissions require text_content, media submissions require media_url',
    path: ['media_type'],
  }
);

export type SubmissionCreate = z.infer<typeof SubmissionCreateSchema>;

// Schema for submission with relations
export const SubmissionWithRelationsSchema = SubmissionSchema.extend({
  profile: ProfileSchema.optional(),
  challenge: ChallengeSchema.optional(),
  user_reaction: ReactionTypeSchema.nullable().optional(),
});

export type SubmissionWithRelations = z.infer<typeof SubmissionWithRelationsSchema>;

// ============================================
// BADGE NFT SCHEMAS
// ============================================

export const BadgeNftSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  submission_id: z.string().uuid(),
  challenge_id: z.string().uuid(),
  mint_address: z.string(),
  metadata_uri: z.string().url(),
  tx_signature: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  image_url: z.string().url(),
  attributes: z.array(
    z.object({
      trait_type: z.string(),
      value: z.union([z.string(), z.number()]),
    })
  ).default([]),
  earned_at: z.string().datetime(),
});

export type BadgeNft = z.infer<typeof BadgeNftSchema>;

// Schema for creating a badge (internal use)
export const BadgeNftCreateSchema = BadgeNftSchema.omit({
  id: true,
  earned_at: true,
});

export type BadgeNftCreate = z.infer<typeof BadgeNftCreateSchema>;

// ============================================
// REACTION SCHEMAS
// ============================================

export const ReactionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  submission_id: z.string().uuid(),
  reaction_type: ReactionTypeSchema,
  created_at: z.string().datetime(),
});

export type Reaction = z.infer<typeof ReactionSchema>;

// Schema for creating a reaction
export const ReactionCreateSchema = z.object({
  submission_id: z.string().uuid(),
  reaction_type: ReactionTypeSchema,
});

export type ReactionCreate = z.infer<typeof ReactionCreateSchema>;

// ============================================
// FOLLOW SCHEMAS
// ============================================

export const FollowSchema = z.object({
  id: z.string().uuid(),
  follower_id: z.string().uuid(),
  following_id: z.string().uuid(),
  created_at: z.string().datetime(),
});

export type Follow = z.infer<typeof FollowSchema>;

export const FollowCreateSchema = z.object({
  following_id: z.string().uuid(),
});

export type FollowCreate = z.infer<typeof FollowCreateSchema>;

// ============================================
// NOTIFICATION SCHEMAS
// ============================================

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  data: z.record(z.any()).default({}),
  is_read: z.boolean().default(false),
  created_at: z.string().datetime(),
  read_at: z.string().datetime().nullable(),
});

export type Notification = z.infer<typeof NotificationSchema>;

// ============================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================

// Pagination
export const PaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

export type Pagination = z.infer<typeof PaginationSchema>;

// Paginated response
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  });

// API Error
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  code: z.string().optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

// API Success
export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    message: z.string().optional(),
  });

// ============================================
// FORM SCHEMAS
// ============================================

// Login form
export const LoginFormSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

export type LoginForm = z.infer<typeof LoginFormSchema>;

// Signup form
export const SignupFormSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  display_name: z.string().min(1, 'Display name is required').max(100),
});

export type SignupForm = z.infer<typeof SignupFormSchema>;

// Profile edit form
export const ProfileEditFormSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  display_name: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
});

export type ProfileEditForm = z.infer<typeof ProfileEditFormSchema>;

// Submission form
export const SubmissionFormSchema = z.object({
  challenge_id: z.string().uuid(),
  media_type: MediaTypeSchema,
  caption: z.string().max(500).optional(),
  text_content: z.string().min(10).optional(),
  // File will be handled separately
});

export type SubmissionForm = z.infer<typeof SubmissionFormSchema>;

// ============================================
// UTILITY VALIDATORS
// ============================================

// Validate EVM wallet address
export const EvmAddressSchema = z
  .string()
  .length(42, 'EVM address must be 42 characters')
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM address');



// Validate transaction hash
export const TxHashSchema = z
  .string()
  .length(66, 'Transaction hash must be 66 characters')
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash');

// Legacy alias
export const TxSignatureSchema = TxHashSchema;

// Validate UUID
export const UUIDSchema = z.string().uuid();
