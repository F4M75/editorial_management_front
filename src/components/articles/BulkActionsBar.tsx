import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ArticleStatus } from '@/types';

interface BulkActionsBarProps {
  count: number;
  onStatusChange: (status: ArticleStatus) => void;
  onClear: () => void;
  isLoading: boolean;
}

const BulkActionsBar = ({ count, onStatusChange, onClear, isLoading }: BulkActionsBarProps) => (
  <div className="flex items-center gap-3 px-4 py-3 bg-[#1a1a2e] text-white rounded-xl">
    <span className="text-sm font-medium">{count} article{count > 1 ? 's' : ''} sélectionné{count > 1 ? 's' : ''}</span>
    <div className="flex items-center gap-2 ml-auto">
      <span className="text-xs text-white/50 mr-1">Changer le statut :</span>
      <Button
        size="sm"
        variant="secondary"
        disabled={isLoading}
        onClick={() => onStatusChange('published')}
        className="bg-green-500 hover:bg-green-600 text-white border-0"
      >
        Publier
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={isLoading}
        onClick={() => onStatusChange('draft')}
        className="bg-yellow-500 hover:bg-yellow-600 text-white border-0"
      >
        Brouillon
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={isLoading}
        onClick={() => onStatusChange('archived')}
        className="bg-gray-500 hover:bg-gray-600 text-white border-0"
      >
        Archiver
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear} className="text-white/60 hover:text-white hover:bg-white/10">
        <X size={16} />
      </Button>
    </div>
  </div>
);

export default BulkActionsBar;
