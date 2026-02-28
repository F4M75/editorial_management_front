import { useCallback, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Send, Bell, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Users, Calendar, Newspaper, Eye, Mail } from 'lucide-react';
import { articleService } from '@/services/article.service';
import { notificationService } from '@/services/notification.service';
import { notifyFormSchema } from '@/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Article, EmailNotification, NotifyFormValues, PaginatedResponse } from '@/types';

// ─── Email preview renderer ───────────────────────────────────────────────────

const renderPreview = (article: Article | null, subject: string): string => {
  if (!article) {
    return `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#aaa;font-family:sans-serif;font-size:14px;">Sélectionnez un article pour prévisualiser l'email</div>`;
  }

  const categories = article.categories
    .map((c) => `<span class="category-tag" style="background-color:${c.category.color}">${c.category.name}</span>`)
    .join('');

  const publishedAt = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#333}
.wrapper{max-width:620px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.header{background:#1a1a2e;padding:28px 40px;text-align:center}
.header .logo{font-size:20px;font-weight:700;color:#fff;letter-spacing:1px;text-transform:uppercase}
.header .tagline{margin-top:4px;font-size:12px;color:#a0a0b8;letter-spacing:2px;text-transform:uppercase}
.badge-wrap{background:#f4f4f7;padding:16px 40px 0}
.badge{display:inline-block;background:#e8f0fe;color:#1a56db;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;padding:4px 12px;border-radius:20px}
.body{padding:24px 40px 40px}
.article-title{font-size:22px;font-weight:700;color:#1a1a2e;line-height:1.3;margin-bottom:14px}
.meta{display:flex;gap:16px;margin-bottom:18px}
.meta-item{font-size:12px;color:#888}
.meta-item span{font-weight:600;color:#555}
.divider{height:1px;background:#eee;margin:18px 0}
.excerpt{font-size:15px;line-height:1.7;color:#555}
.cta-wrap{margin-top:28px;text-align:center}
.cta-button{display:inline-block;background:#1a1a2e;color:#fff!important;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:6px;letter-spacing:.5px}
.categories{margin-top:24px}
.categories-label{font-size:11px;font-weight:600;color:#888;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px}
.category-tag{display:inline-block;font-size:12px;font-weight:500;padding:3px 10px;border-radius:4px;margin-right:6px;margin-bottom:4px;color:#fff}
.footer{background:#f4f4f7;padding:20px 40px;text-align:center;border-top:1px solid #eee}
.footer p{font-size:12px;color:#aaa;line-height:1.6}
.footer a{color:#1a56db;text-decoration:none}
.network-name{font-weight:600;color:#555}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo">Editorial</div>
    <div class="tagline">${article.network.name}</div>
  </div>
  <div class="badge-wrap"><span class="badge">Nouvel article</span></div>
  <div class="body">
    <h1 class="article-title">${article.title}</h1>
    <div class="meta">
      <div class="meta-item">Par <span>${article.author}</span></div>
      <div class="meta-item">Publié le <span>${publishedAt}</span></div>
    </div>
    <div class="divider"></div>
    <p class="excerpt">${article.excerpt}</p>
    <div class="cta-wrap"><a href="#" class="cta-button">Lire l'article complet</a></div>
    ${categories ? `<div class="categories"><div class="categories-label">Catégories</div>${categories}</div>` : ''}
  </div>
  <div class="footer">
    <p>Vous recevez cet email car vous êtes abonné au réseau <span class="network-name">${article.network.name}</span>.<br/><a href="#">Se désabonner</a></p>
  </div>
</div>
</body>
</html>`;
};

// ─── History row ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: EmailNotification['status'] }) =>
  status === 'sent' ? (
    <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
      <CheckCircle2 size={11} /> Envoyé
    </span>
  ) : (
    <span className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">
      <XCircle size={11} /> Échoué
    </span>
  );

// ─── Page ─────────────────────────────────────────────────────────────────────

const LIMIT = 10;

const NotificationsPage = () => {
  // ── Articles for selector ─────────────────────────────────────────────────
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // ── History ───────────────────────────────────────────────────────────────
  const [historyPage, setHistoryPage] = useState(1);
  const [history, setHistory] = useState<PaginatedResponse<EmailNotification> | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  // ── Preview dialog ────────────────────────────────────────────────────────
  const [previewNotif, setPreviewNotif] = useState<EmailNotification | null>(null);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const openPreview = async (notif: EmailNotification) => {
    setPreviewNotif(notif);
    setPreviewArticle(null);
    setPreviewLoading(true);
    try {
      const article = await articleService.getById(notif.articleId);
      setPreviewArticle(article);
    } catch {
      toast.error("Impossible de charger l'article");
    } finally {
      setPreviewLoading(false);
    }
  };

  // ── Form ──────────────────────────────────────────────────────────────────
  const { control, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } =
    useForm<NotifyFormValues>({
      resolver: zodResolver(notifyFormSchema),
      defaultValues: { articleId: '', recipients: '', subject: '' },
    });

  const watchedSubject = watch('subject');
  const watchedArticleId = watch('articleId');

  // Load published articles
  useEffect(() => {
    articleService.getAll({ status: 'published', limit: 100 }).then((res) => setArticles(res.data)).catch(() => {});
  }, []);

  // Sync selected article object when articleId changes
  useEffect(() => {
    const found = articles.find((a) => a.id === watchedArticleId) ?? null;
    setSelectedArticle(found);
    if (found && !watchedSubject) {
      setValue('subject', `Nouvel article : ${found.title}`);
    }
  }, [watchedArticleId, articles]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-update subject when article changes (only if subject matches pattern)
  useEffect(() => {
    if (!selectedArticle) return;
    const currentSubject = watchedSubject;
    if (!currentSubject || currentSubject.startsWith('Nouvel article :')) {
      setValue('subject', `Nouvel article : ${selectedArticle.title}`);
    }
  }, [selectedArticle]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load history
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await notificationService.getAll(historyPage, LIMIT);
      setHistory(data);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage]);

  useEffect(() => { void loadHistory(); }, [loadHistory]);

  // Submit
  const onSubmit = async (values: NotifyFormValues) => {
    const recipientList = values.recipients.split(',').map((e) => e.trim()).filter(Boolean);
    try {
      await articleService.notify(values.articleId, recipientList, values.subject);
      toast.success(`Notification envoyée à ${recipientList.length} destinataire(s)`);
      reset({ articleId: '', recipients: '', subject: '' });
      setSelectedArticle(null);
      void loadHistory();
    } catch {
      toast.error("Erreur lors de l'envoi de la notification");
    }
  };

  const previewHtml = renderPreview(selectedArticle, watchedSubject);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500 mt-1">Envoyez des emails de notification pour vos articles</p>
      </div>

      {/* ── Send section ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Form */}
        <div className="bg-white rounded-xl border p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Send size={16} className="text-gray-400" /> Envoyer une notification
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Article */}
            <div className="space-y-1.5">
              <Label>Article <span className="text-red-400">*</span></Label>
              <Controller name="articleId" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={errors.articleId ? 'border-red-400' : ''}>
                    <SelectValue placeholder="Sélectionner un article publié…" />
                  </SelectTrigger>
                  <SelectContent>
                    {articles.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-400">Aucun article publié</div>
                    )}
                    {articles.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        <span className="truncate max-w-xs block">{a.title}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              {errors.articleId && <p className="text-xs text-red-500">{errors.articleId.message}</p>}
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <Label htmlFor="subject">Sujet <span className="text-red-400">*</span></Label>
              <Controller name="subject" control={control} render={({ field }) => (
                <Input
                  id="subject"
                  placeholder="Sujet de l'email…"
                  {...field}
                  className={errors.subject ? 'border-red-400' : ''}
                />
              )} />
              {errors.subject && <p className="text-xs text-red-500">{errors.subject.message}</p>}
            </div>

            {/* Recipients */}
            <div className="space-y-1.5">
              <Label htmlFor="recipients">
                Destinataires <span className="text-red-400">*</span>
                <span className="ml-1 font-normal text-gray-400">(séparés par des virgules)</span>
              </Label>
              <Controller name="recipients" control={control} render={({ field }) => (
                <Input
                  id="recipients"
                  placeholder="email1@exemple.com, email2@exemple.com"
                  {...field}
                  className={errors.recipients ? 'border-red-400' : ''}
                />
              )} />
              {watch('recipients') && !errors.recipients && (
                <p className="text-xs text-gray-400">
                  {watch('recipients').split(',').map((e) => e.trim()).filter(Boolean).length} destinataire(s)
                </p>
              )}
              {errors.recipients && <p className="text-xs text-red-500">{errors.recipients.message}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
              <Send size={15} />
              {isSubmitting ? 'Envoi en cours…' : 'Envoyer la notification'}
            </Button>
          </form>
        </div>

        {/* Email preview */}
        <div className="bg-white rounded-xl border overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between shrink-0">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Prévisualisation email</span>
            {selectedArticle && (
              <Badge variant="outline" className="text-xs">{selectedArticle.network.name}</Badge>
            )}
          </div>
          <iframe
            srcDoc={previewHtml}
            title="Email preview"
            className="flex-1 w-full border-0"
            style={{ minHeight: '420px' }}
            sandbox="allow-same-origin"
          />
        </div>
      </div>

      {/* ── History ── */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <Bell size={16} className="text-gray-400" /> Historique des notifications
        </h2>

        <div className="bg-white rounded-xl border overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Newspaper size={12} /> Article</span>
            <span className="flex items-center gap-1.5"><Users size={12} /> Destinataires</span>
            <span className="flex items-center gap-1.5"><Calendar size={12} /> Date</span>
            <span>Statut</span>
            <span></span>
          </div>

          {/* Rows */}
          {historyLoading ? (
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-4 items-center">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : history?.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
              <Bell size={36} strokeWidth={1.5} />
              <p className="text-sm">Aucune notification envoyée pour l'instant</p>
            </div>
          ) : (
            <div className="divide-y">
              {history?.data.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => openPreview(notif)}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-4 items-center hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{notif.article.title}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{notif.subject}</p>
                  </div>
                  <span className="text-sm text-gray-600 text-center">{notif.recipients.length}</span>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {new Date(notif.sentAt).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  <StatusBadge status={notif.status} />
                  <Eye size={15} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {history && history.meta.total > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t text-sm text-gray-500 bg-gray-50">
              <span>
                {(history.meta.page - 1) * LIMIT + 1}–{Math.min(history.meta.page * LIMIT, history.meta.total)} sur {history.meta.total}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline" size="sm"
                  disabled={historyPage === 1}
                  onClick={() => setHistoryPage((p) => p - 1)}
                >
                  <ChevronLeft size={15} />
                </Button>
                <span className="text-xs">Page {history.meta.page} / {history.meta.totalPages}</span>
                <Button
                  variant="outline" size="sm"
                  disabled={historyPage === history.meta.totalPages}
                  onClick={() => setHistoryPage((p) => p + 1)}
                >
                  <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* ── Preview dialog ── */}
      <Dialog open={!!previewNotif} onOpenChange={(open) => { if (!open) { setPreviewNotif(null); setPreviewArticle(null); } }}>
        <DialogContent className="max-w-3xl w-full p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b bg-gray-50 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Mail size={16} className="text-gray-400" />
              Prévisualisation de l'email
            </DialogTitle>
          </DialogHeader>

          {previewNotif && (
            <div className="flex flex-col">
              {/* Metadata strip */}
              <div className="grid grid-cols-3 gap-px bg-gray-100 border-b text-xs shrink-0">
                <div className="bg-white px-4 py-3 space-y-0.5">
                  <p className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Sujet</p>
                  <p className="text-gray-800 font-medium truncate">{previewNotif.subject}</p>
                </div>
                <div className="bg-white px-4 py-3 space-y-0.5">
                  <p className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Destinataires</p>
                  <p className="text-gray-800">{previewNotif.recipients.join(', ')}</p>
                </div>
                <div className="bg-white px-4 py-3 space-y-0.5 flex flex-col justify-between">
                  <p className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Envoyé le</p>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-800">
                      {new Date(previewNotif.sentAt).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                    <StatusBadge status={previewNotif.status} />
                  </div>
                </div>
              </div>

              {/* Email preview */}
              {previewLoading ? (
                <div className="flex items-center justify-center h-96 text-gray-400 text-sm gap-2">
                  <div className="h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  Chargement de l'aperçu…
                </div>
              ) : (
                <iframe
                  srcDoc={renderPreview(previewArticle, previewNotif.subject)}
                  title="Email preview"
                  className="w-full border-0"
                  style={{ height: '480px' }}
                  sandbox="allow-same-origin"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationsPage;
