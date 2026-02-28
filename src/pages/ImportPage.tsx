import { useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Upload, FileJson, X, CheckCircle2, XCircle,
  AlertTriangle, Download, RefreshCw,
} from 'lucide-react';
import { articleService } from '@/services/article.service';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

// ─── Expected format sample ───────────────────────────────────────────────────

const FORMAT_SAMPLE = JSON.stringify(
  [
    {
      title: 'Titre de l\'article',
      content: 'Contenu complet de l\'article...',
      excerpt: 'Résumé court',
      author: 'Nom Auteur',
      network: 'Nom du réseau',
      category: 'nom-categorie',
      status: 'published',
      featured: false,
    },
  ],
  null,
  2,
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const ImportPage = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<unknown[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  // ── File handling ──────────────────────────────────────────────────────────

  const processFile = (f: File) => {
    setResult(null);
    setParseError(null);
    setPreview(null);

    if (!f.name.endsWith('.json')) {
      setParseError('Le fichier doit être au format .json');
      return;
    }

    setFile(f);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!Array.isArray(parsed)) {
          setParseError('Le JSON doit être un tableau [ ... ]');
          setFile(null);
          return;
        }
        setPreview(parsed);
      } catch {
        setParseError('JSON invalide — vérifiez la syntaxe du fichier');
        setFile(null);
      }
    };
    reader.readAsText(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) processFile(dropped);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
    e.target.value = '';
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setParseError(null);
    setResult(null);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await articleService.import(file) as ImportResult;
      setResult(res);
      if (res.failed === 0) {
        toast.success(`${res.success} article(s) importé(s) avec succès`);
      } else if (res.success === 0) {
        toast.error(`Import échoué — ${res.failed} erreur(s)`);
      } else {
        toast.warning(`${res.success} importé(s), ${res.failed} échoué(s)`);
      }
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        "Erreur lors de l'import";
      toast.error(msg);
      setResult({ success: 0, failed: preview?.length ?? 0, errors: [msg] });
    } finally {
      setLoading(false);
    }
  };

  // ── Download sample ────────────────────────────────────────────────────────

  const downloadSample = () => {
    const a = document.createElement('a');
    a.href = '/articles-import-exemple.json';
    a.download = 'articles-import-exemple.json';
    a.click();
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import d'articles</h1>
          <p className="text-sm text-gray-500 mt-1">Importez des articles en masse via un fichier JSON</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={downloadSample}>
          <Download size={14} /> Télécharger le modèle
        </Button>
      </div>

      {/* ── Drop zone ── */}
      {!file && !parseError && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors',
            dragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100',
          )}
        >
          <div className="h-14 w-14 rounded-full bg-white border flex items-center justify-center shadow-sm">
            <Upload size={24} className={dragging ? 'text-blue-500' : 'text-gray-400'} />
          </div>
          <div className="text-center">
            <p className="font-medium text-gray-700">
              {dragging ? 'Déposez le fichier ici' : 'Glissez-déposez votre fichier JSON'}
            </p>
            <p className="text-sm text-gray-400 mt-1">ou cliquez pour sélectionner</p>
          </div>
          <span className="text-xs text-gray-400 border rounded-full px-3 py-1 bg-white">.json uniquement</span>
          <input ref={inputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
        </div>
      )}

      {/* ── Parse error ── */}
      {parseError && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50">
          <XCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700">{parseError}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={reset}>
            <X size={14} />
          </Button>
        </div>
      )}

      {/* ── File loaded: preview + actions ── */}
      {file && preview && !result && (
        <div className="space-y-4">
          {/* File info bar */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-white">
            <FileJson size={20} className="text-blue-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
              <p className="text-xs text-gray-400">
                {preview.length} article{preview.length !== 1 ? 's' : ''} détecté{preview.length !== 1 ? 's' : ''} ·{' '}
                {(file.size / 1024).toFixed(1)} Ko
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={reset}>
              <X size={15} />
            </Button>
          </div>

          {/* JSON preview */}
          <div className="rounded-xl border overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Aperçu du contenu</span>
              <span className="text-xs text-gray-400">{preview.length} entrée{preview.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="max-h-72 overflow-auto bg-gray-900 text-gray-100 text-xs font-mono p-4 leading-relaxed">
              <pre>{JSON.stringify(preview.slice(0, 5), null, 2)}{preview.length > 5 ? `\n\n// ... ${preview.length - 5} ligne(s) supplémentaire(s)` : ''}</pre>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button onClick={handleImport} disabled={loading} className="gap-2">
              <Upload size={15} />
              {loading ? 'Import en cours…' : `Importer ${preview.length} article${preview.length !== 1 ? 's' : ''}`}
            </Button>
            <Button variant="outline" onClick={reset} disabled={loading}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* ── Result ── */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className={cn(
            'rounded-xl border p-5 flex items-start gap-4',
            result.failed === 0 ? 'border-green-200 bg-green-50' :
            result.success === 0 ? 'border-red-200 bg-red-50' :
            'border-amber-200 bg-amber-50',
          )}>
            {result.failed === 0 ? (
              <CheckCircle2 size={22} className="text-green-600 shrink-0 mt-0.5" />
            ) : result.success === 0 ? (
              <XCircle size={22} className="text-red-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={22} className="text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold text-gray-800">
                {result.failed === 0
                  ? 'Import réussi !'
                  : result.success === 0
                  ? 'Import échoué'
                  : 'Import partiel'}
              </p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1.5 text-green-700 font-medium">
                  <CheckCircle2 size={13} /> {result.success} succès
                </span>
                {result.failed > 0 && (
                  <span className="flex items-center gap-1.5 text-red-700 font-medium">
                    <XCircle size={13} /> {result.failed} échec{result.failed !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Error list */}
          {result.errors.length > 0 && (
            <div className="rounded-xl border border-red-200 overflow-hidden">
              <div className="px-4 py-2 bg-red-50 border-b">
                <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">
                  Détail des erreurs ({result.errors.length})
                </span>
              </div>
              <ul className="divide-y max-h-60 overflow-auto">
                {result.errors.map((err, i) => (
                  <li key={i} className="flex items-start gap-2.5 px-4 py-3 text-sm text-red-700 bg-white hover:bg-red-50">
                    <XCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* New import */}
          <Button variant="outline" onClick={reset} className="gap-2">
            <RefreshCw size={14} /> Nouvel import
          </Button>
        </div>
      )}

      {/* ── Expected format ── */}
      <div className="rounded-xl border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Format JSON attendu</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Les champs <code className="bg-gray-100 px-1 rounded">network</code> et{' '}
            <code className="bg-gray-100 px-1 rounded">category</code> sont résolus par nom/slug.
            Les champs <code className="bg-gray-100 px-1 rounded">status</code> et{' '}
            <code className="bg-gray-100 px-1 rounded">featured</code> sont optionnels (défaut : <em>draft</em> / <em>false</em>).
          </p>
        </div>
        <div className="bg-gray-900 text-gray-100 text-xs font-mono p-4 leading-relaxed overflow-auto">
          <pre>{FORMAT_SAMPLE}</pre>
        </div>
      </div>
    </div>
  );
};

export default ImportPage;
