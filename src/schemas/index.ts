import { z } from 'zod';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

// ─── Entity schemas ───────────────────────────────────────────────────────────

export const UserSchema = z.object({
  id:        z.string(),
  email:     z.string().email(),
  name:      z.string(),
  role:      z.enum(['admin', 'editor']),
  networkId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const NetworkSchema = z.object({
  id:          z.string(),
  name:        z.string(),
  description: z.string(),
});

export const CategorySchema = z.object({
  id:          z.string(),
  name:        z.string(),
  slug:        z.string(),
  description: z.string().nullable().optional(),
  color:       z.string(),
  _count:      z.object({ articles: z.number() }).optional(),
});

export const ArticleStatusSchema = z.enum(['draft', 'published', 'archived']);

export const ArticleSchema = z.object({
  id:          z.string(),
  title:       z.string(),
  content:     z.string(),
  excerpt:     z.string(),
  author:      z.string(),
  networkId:   z.string(),
  network:     NetworkSchema,
  categories:  z.array(z.object({ category: CategorySchema })),
  status:      ArticleStatusSchema,
  featured:    z.boolean(),
  publishedAt: z.string().nullable(),
  createdAt:   z.string(),
  updatedAt:   z.string(),
});

export const EmailNotificationSchema = z.object({
  id:         z.string(),
  articleId:  z.string(),
  article:    z.object({ id: z.string(), title: z.string() }),
  recipients: z.array(z.string()),
  subject:    z.string(),
  sentAt:     z.string(),
  status:     z.enum(['sent', 'failed']),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      total:      z.number(),
      page:       z.number(),
      limit:      z.number(),
      totalPages: z.number(),
    }),
  });

export const StatsSchema = z.object({
  articles: z.object({
    total:     z.number(),
    draft:     z.number(),
    published: z.number(),
    archived:  z.number(),
  }),
  byNetwork:            z.array(z.object({ id: z.string(), name: z.string(), count: z.number() })),
  byCategory:           z.array(z.object({ id: z.string(), name: z.string(), color: z.string(), count: z.number() })),
  recentArticles:       z.array(ArticleSchema),
  recentNotifications:  z.array(EmailNotificationSchema),
});

export const LoginCredentialsSchema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const AuthResponseSchema = z.object({
  token: z.string(),
  user:  UserSchema,
});

// ─── Filter / query schemas ───────────────────────────────────────────────────

export const ArticleFiltersSchema = z.object({
  status:     ArticleStatusSchema.optional(),
  featured:   z.boolean().optional(),
  networkId:  z.string().optional(),
  categoryId: z.string().optional(),
  author:     z.string().optional(),
  search:     z.string().optional(),
  page:       z.number().optional(),
  limit:      z.number().optional(),
});

// ─── Form schemas ─────────────────────────────────────────────────────────────

export const categoryFormSchema = z.object({
  name:        z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  slug:        z.string()
                 .min(2, 'Le slug doit contenir au moins 2 caractères')
                 .regex(/^[a-z0-9-]+$/, 'Slug : lettres minuscules, chiffres et tirets uniquement'),
  description: z.string().optional(),
  color:       z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hexadécimale invalide'),
});

export const notifyFormSchema = z.object({
  articleId:  z.string().min(1, "Sélectionnez un article"),
  recipients: z.string().min(1, "Au moins un destinataire requis").refine(
    (v) => v.split(',').map((e) => e.trim()).filter(Boolean).every((e) => z.string().email().safeParse(e).success),
    "Un ou plusieurs emails sont invalides"
  ),
  subject: z.string().min(1, "Le sujet est requis"),
});

export const articleFormSchema = z.object({
  title:      z.string().min(5, 'Le titre doit contenir au moins 5 caractères'),
  excerpt:    z.string().min(1, "L'extrait est requis"),
  content:    z.string().refine((v) => stripHtml(v).length >= 50, 'Le contenu doit contenir au moins 50 caractères'),
  author:     z.string().min(1, "L'auteur est requis"),
  networkId:  z.string().min(1, 'Le réseau est obligatoire'),
  categories: z.array(z.string()).min(1, 'Sélectionnez au moins une catégorie'),
  status:     ArticleStatusSchema,
  featured:   z.boolean(),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type User               = z.infer<typeof UserSchema>;
export type Network            = z.infer<typeof NetworkSchema>;
export type Category           = z.infer<typeof CategorySchema>;
export type ArticleStatus      = z.infer<typeof ArticleStatusSchema>;
export type Article            = z.infer<typeof ArticleSchema>;
export type EmailNotification  = z.infer<typeof EmailNotificationSchema>;
export type Stats              = z.infer<typeof StatsSchema>;
export type LoginCredentials   = z.infer<typeof LoginCredentialsSchema>;
export type AuthResponse       = z.infer<typeof AuthResponseSchema>;
export type ArticleFilters     = z.infer<typeof ArticleFiltersSchema>;
export type CategoryFormValues  = z.infer<typeof categoryFormSchema>;
export type ArticleFormValues   = z.infer<typeof articleFormSchema>;
export type NotifyFormValues    = z.infer<typeof notifyFormSchema>;
export type PaginatedResponse<T> = { data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } };
