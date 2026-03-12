'use client';

import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  categories: string[];
  selected: string;
  onChange: (category: string) => void;
}

export function CategoryFilter({ categories, selected, onChange }: CategoryFilterProps) {
  const allCategories = ['All', ...categories];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {allCategories.map((category) => {
        const isActive = (category === 'All' && !selected) || category === selected;
        return (
          <button
            key={category}
            onClick={() => onChange(category === 'All' ? '' : category)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
