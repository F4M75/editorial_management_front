import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Tag, FileText } from 'lucide-react';
import { categoryService } from '@/services/category.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { categoryFormSchema } from '@/schemas';
import type { Category, CategoryFormValues } from '@/types';

type FormValues = CategoryFormValues;

// ─── Preset colours ───────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#3B82F6', '#EF4444', '#8B5CF6', '#10B981', '#F59E0B',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];

// ─── Category form dialog ─────────────────────────────────────────────────────

interface CategoryDialogProps {
  open: boolean;
  initial?: Category | null;
  onClose: () => void;
  onSaved: () => void;
}

const CategoryDialog = ({ open, initial, onClose, onSaved }: CategoryDialogProps) => {
  const isEdit = !!initial;

  const { control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: '', slug: '', description: '', color: '#3B82F6' },
  });

  useEffect(() => {
    if (open) {
      reset(initial
        ? { name: initial.name, slug: initial.slug, description: initial.description ?? '', color: initial.color }
        : { name: '', slug: '', description: '', color: '#3B82F6' }
      );
    }
  }, [open, initial, reset]);

  // Auto-generate slug from name (create mode only)
  const nameValue = watch('name');
  useEffect(() => {
    if (isEdit) return;
    const slug = nameValue
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    setValue('slug', slug, { shouldValidate: false });
  }, [nameValue, isEdit, setValue]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit && initial) {
        await categoryService.update(initial.id, values);
        toast.success('Catégorie mise à jour');
      } else {
        await categoryService.create(values as Omit<Category, 'id'>);
        toast.success('Catégorie créée');
      }
      onSaved();
      onClose();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const currentColor = watch('color');

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Nom <span className="text-red-400">*</span></Label>
            <Controller name="name" control={control} render={({ field }) => (
              <Input id="cat-name" placeholder="Ex: Technologie" {...field} className={errors.name ? 'border-red-400' : ''} />
            )} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label htmlFor="cat-slug">Slug <span className="text-red-400">*</span></Label>
            <Controller name="slug" control={control} render={({ field }) => (
              <Input id="cat-slug" placeholder="ex: technologie" {...field} className={errors.slug ? 'border-red-400' : ''} />
            )} />
            {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">Description</Label>
            <Controller name="description" control={control} render={({ field }) => (
              <Textarea id="cat-desc" placeholder="Description optionnelle..." rows={2} {...field} />
            )} />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Couleur <span className="text-red-400">*</span></Label>
            <div className="flex items-center gap-3">
              <Controller name="color" control={control} render={({ field }) => (
                <input
                  type="color"
                  value={field.value}
                  onChange={field.onChange}
                  className="h-9 w-12 cursor-pointer rounded border border-gray-200 p-0.5"
                />
              )} />
              <Controller name="color" control={control} render={({ field }) => (
                <Input
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="#3B82F6"
                  className={`w-32 font-mono text-sm ${errors.color ? 'border-red-400' : ''}`}
                />
              )} />
              <div className="h-8 w-8 rounded-full border shadow-sm" style={{ backgroundColor: currentColor }} />
            </div>
            {/* Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue('color', c, { shouldValidate: true })}
                  className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: currentColor === c ? '#111' : 'transparent',
                  }}
                />
              ))}
            </div>
            {errors.color && <p className="text-xs text-red-500">{errors.color.message}</p>}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const openCreate = () => { setEditTarget(null); setDialogOpen(true); };
  const openEdit = (cat: Category) => { setEditTarget(cat); setDialogOpen(true); };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await categoryService.delete(deleteTarget.id);
      toast.success('Catégorie supprimée');
      setDeleteTarget(null);
      void load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      // Extract axios response message if available
      const axiosMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setDeleteError(axiosMsg ?? msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isLoading ? '—' : `${categories.length} catégorie${categories.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} /> Nouvelle catégorie
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl border bg-gray-50 animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <Tag size={40} strokeWidth={1.5} />
          <p className="text-sm">Aucune catégorie pour le moment</p>
          <Button variant="outline" size="sm" onClick={openCreate} className="gap-2 mt-1">
            <Plus size={14} /> Créer la première catégorie
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const articleCount = cat._count?.articles ?? 0;
            return (
              <div
                key={cat.id}
                className="bg-white rounded-xl border p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                {/* Top row: colour swatch + name */}
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{cat.name}</p>
                    <p className="text-xs text-gray-400 font-mono truncate">{cat.slug}</p>
                  </div>
                  {/* Color hex badge */}
                  <span
                    className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full text-white shrink-0"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.color}
                  </span>
                </div>

                {/* Description */}
                {cat.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{cat.description}</p>
                )}

                {/* Article count + actions */}
                <div className="flex items-center justify-between mt-auto pt-1 border-t">
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <FileText size={13} />
                    {articleCount} article{articleCount !== 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-gray-700"
                      onClick={() => openEdit(cat)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-600"
                      onClick={() => { setDeleteError(null); setDeleteTarget(cat); }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit dialog */}
      <CategoryDialog
        open={dialogOpen}
        initial={editTarget}
        onClose={() => setDialogOpen(false)}
        onSaved={load}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) { setDeleteTarget(null); setDeleteError(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la catégorie ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError ? (
                <span className="text-red-600 font-medium">{deleteError}</span>
              ) : (
                <>
                  Vous allez supprimer <span className="font-semibold">{deleteTarget?.name}</span>.
                  {(deleteTarget?._count?.articles ?? 0) > 0 && (
                    <span className="block mt-1 text-amber-600 font-medium">
                      Cette catégorie est utilisée par {deleteTarget?._count?.articles} article(s) et ne peut pas être supprimée.
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            {(deleteTarget?._count?.articles ?? 0) === 0 && !deleteError && (
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoriesPage;
