import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Save, Star, StarOff, Clock, CheckCircle2, Circle } from 'lucide-react';
import { articleService } from '@/services/article.service';
import { useCategories } from '@/hooks/useCategories';
import { useNetworks } from '@/hooks/useNetworks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RichTextEditor from '@/components/articles/RichTextEditor';
import ArticlePreview from '@/components/articles/ArticlePreview';
import type { Category } from '@/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

const schema = z.object({
  title:      z.string().min(5, 'Le titre doit contenir au moins 5 caractères'),
  excerpt:    z.string().min(1, "L'extrait est requis"),
  content:    z.string().refine((v) => stripHtml(v).length >= 50, 'Le contenu doit contenir au moins 50 caractères'),
  author:     z.string().min(1, "L'auteur est requis"),
  networkId:  z.string().min(1, 'Le réseau est obligatoire'),
  categories: z.array(z.string()).min(1, 'Sélectionnez au moins une catégorie'),
  status:     z.enum(['draft', 'published', 'archived']),
  featured:   z.boolean(),
});

type FormValues = z.infer<typeof schema>;

// ─── Save indicator ───────────────────────────────────────────────────────────

type SaveState = 'idle' | 'saving' | 'saved' | 'unsaved';

const SaveIndicator = ({ state, lastSaved }: { state: SaveState; lastSaved: Date | null }) => {
  const map: Record<SaveState, { icon: React.ReactNode; text: string; color: string }> = {
    idle:    { icon: <Circle size={12} />,        text: '',                         color: 'text-gray-300' },
    unsaved: { icon: <Circle size={12} />,        text: 'Modifications non sauvegardées', color: 'text-yellow-500' },
    saving:  { icon: <Clock size={12} />,         text: 'Sauvegarde en cours...',   color: 'text-blue-500' },
    saved:   { icon: <CheckCircle2 size={12} />,  text: `Sauvegardé à ${lastSaved?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, color: 'text-green-500' },
  };
  const { icon, text, color } = map[state];
  if (!text) return null;
  return (
    <span className={`flex items-center gap-1.5 text-xs ${color}`}>
      {icon}{text}
    </span>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const ArticleFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { categories } = useCategories();
  const { networks } = useNetworks();
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { control, handleSubmit, watch, setValue, reset, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '', excerpt: '', content: '', author: '',
      networkId: '', categories: [], status: 'draft', featured: false,
    },
  });

  // Watch all values for preview + autosave
  const watched = watch();

  // ── Load article for edit mode ─────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    articleService.getById(id).then((article) => {
      reset({
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        author: article.author,
        networkId: article.networkId,
        categories: article.categories.map((c) => c.category.id),
        status: article.status,
        featured: article.featured,
      });
    }).catch(() => toast.error('Erreur lors du chargement de l\'article'));
  }, [id, reset]);

  // ── Mark unsaved when dirty ────────────────────────────────────────────────
  useEffect(() => {
    if (isDirty) setSaveState('unsaved');
  }, [isDirty]);

  // ── Auto-save every 30s ────────────────────────────────────────────────────
  useEffect(() => {
    if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    autoSaveRef.current = setInterval(() => {
      if (!isDirty) return;
      void autoSave();
    }, 30000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [isDirty, watched]); // eslint-disable-line react-hooks/exhaustive-deps

  const autoSave = async () => {
    const values = watched;
    if (!values.title) return;
    setSaveState('saving');
    try {
      const payload = { ...values, status: 'draft' as const };
      if (isEdit && id) {
        await articleService.update(id, payload);
      } else {
        await articleService.create(payload);
      }
      setLastSaved(new Date());
      setSaveState('saved');
    } catch {
      setSaveState('unsaved');
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (values: FormValues) => {
    setSaveState('saving');
    try {
      if (isEdit && id) {
        await articleService.update(id, values);
        toast.success('Article mis à jour');
      } else {
        await articleService.create(values);
        toast.success('Article créé');
      }
      setLastSaved(new Date());
      setSaveState('saved');
      navigate('/articles');
    } catch {
      setSaveState('unsaved');
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  // ── Category toggle ────────────────────────────────────────────────────────
  const toggleCategory = (catId: string) => {
    const current = watched.categories;
    setValue(
      'categories',
      current.includes(catId) ? current.filter((c) => c !== catId) : [...current, catId],
      { shouldDirty: true }
    );
  };

  const selectedCategories = categories.filter((c: Category) => watched.categories.includes(c.id));
  const selectedNetwork = networks.find((n) => n.id === watched.networkId) ?? null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/articles')} className="gap-2 text-gray-500">
            <ArrowLeft size={16} /> Articles
          </Button>
          <span className="text-sm font-semibold text-gray-900">
            {isEdit ? 'Modifier l\'article' : 'Nouvel article'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <SaveIndicator state={saveState} lastSaved={lastSaved} />
          <Button type="submit" form="article-form" className="gap-2">
            <Save size={16} />
            {isEdit ? 'Mettre à jour' : 'Publier'}
          </Button>
        </div>
      </div>

      {/* ── Split layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Form (left) ── */}
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
          <form id="article-form" onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-5">

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">Titre <span className="text-red-400">*</span></Label>
              <Controller name="title" control={control} render={({ field }) => (
                <Input id="title" placeholder="Titre de l'article..." {...field} className={errors.title ? 'border-red-400' : ''} />
              )} />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>

            {/* Excerpt */}
            <div className="space-y-1.5">
              <Label htmlFor="excerpt">Extrait <span className="text-red-400">*</span></Label>
              <Controller name="excerpt" control={control} render={({ field }) => (
                <Textarea id="excerpt" placeholder="Résumé de l'article affiché en aperçu..." rows={2} {...field} className={errors.excerpt ? 'border-red-400' : ''} />
              )} />
              {errors.excerpt && <p className="text-xs text-red-500">{errors.excerpt.message}</p>}
            </div>

            {/* Author + Network */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="author">Auteur <span className="text-red-400">*</span></Label>
                <Controller name="author" control={control} render={({ field }) => (
                  <Input id="author" placeholder="Nom de l'auteur" {...field} className={errors.author ? 'border-red-400' : ''} />
                )} />
                {errors.author && <p className="text-xs text-red-500">{errors.author.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Réseau <span className="text-red-400">*</span></Label>
                <Controller name="networkId" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.networkId ? 'border-red-400' : ''}>
                      <SelectValue placeholder="Choisir un réseau" />
                    </SelectTrigger>
                    <SelectContent>
                      {networks.map((n) => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
                {errors.networkId && <p className="text-xs text-red-500">{errors.networkId.message}</p>}
              </div>
            </div>

            {/* Status + Featured */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Controller name="status" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="published">Publié</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>

              <div className="space-y-1.5">
                <Label>Mise en avant</Label>
                <Controller name="featured" control={control} render={({ field }) => (
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full gap-2 ${field.value ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : ''}`}
                    onClick={() => field.onChange(!field.value)}
                  >
                    {field.value
                      ? <><StarOff size={15} /> Retirer la mise en avant</>
                      : <><Star size={15} /> Mettre en avant</>}
                  </Button>
                )} />
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <Label>Catégories <span className="text-red-400">*</span></Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat: Category) => {
                  const selected = watched.categories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`text-sm px-3 py-1.5 rounded-full border-2 font-medium transition-all ${
                        selected
                          ? 'text-white border-transparent shadow-sm'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                      style={selected ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
              {errors.categories && <p className="text-xs text-red-500">{errors.categories.message}</p>}
            </div>

            {/* Rich text content */}
            <div className="space-y-1.5">
              <Label>Contenu <span className="text-red-400">*</span></Label>
              <Controller name="content" control={control} render={({ field }) => (
                <RichTextEditor value={field.value} onChange={field.onChange} error={errors.content?.message} />
              )} />
              {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
            </div>

          </form>
        </div>

        {/* ── Preview (right) ── */}
        <div className="w-[420px] shrink-0 border-l p-4 overflow-auto bg-white">
          <ArticlePreview
            title={watched.title}
            excerpt={watched.excerpt}
            content={watched.content}
            author={watched.author}
            featured={watched.featured}
            categories={selectedCategories}
            network={selectedNetwork}
          />
        </div>
      </div>
    </div>
  );
};

export default ArticleFormPage;
