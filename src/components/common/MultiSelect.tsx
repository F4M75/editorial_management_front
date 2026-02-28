import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  color?: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

const MultiSelect = ({ options, selected, onChange, placeholder = 'Sélectionner...' }: MultiSelectProps) => {
  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? placeholder)
        : `${selected.length} sélectionnés`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-between min-w-40 font-normal">
          <span className="truncate">{label}</span>
          <ChevronDown size={14} className="ml-2 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2">
        {options.length === 0 ? (
          <p className="text-sm text-gray-400 px-2 py-1">Aucune option</p>
        ) : (
          options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
            >
              <Checkbox
                checked={selected.includes(opt.value)}
                onCheckedChange={() => toggle(opt.value)}
              />
              {opt.color && (
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: opt.color }}
                />
              )}
              <span className="text-sm">{opt.label}</span>
            </label>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
};

export default MultiSelect;
