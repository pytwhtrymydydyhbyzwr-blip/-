import React from 'react';
import * as Icons from 'lucide-react';

interface HabitIconProps {
  name: string;
  className?: string;
}

export const HabitIcon: React.FC<HabitIconProps> = ({ name, className = 'w-5 h-5' }) => {
  const IconComponent = (Icons as unknown as Record<string, React.FC<{ className?: string }>>)[name] || Icons.Flame;
  return <IconComponent className={className} />;
};

export const HABIT_ICONS_LIST = [
  'Droplet',
  'Book',
  'Brain',
  'Dumbbell',
  'Sparkles',
  'Moon',
  'Flame',
  'Heart',
  'Sun',
  'Coffee',
  'Footprints',
  'Smile',
  'Target',
  'Shield',
  'Utensils',
  'Apple',
  'Pencil',
  'Bike',
  'CheckCircle',
  'Zap',
  'Music',
  'Compass',
  'Award',
  'Trophy',
  'Star',
];

export const HABIT_COLORS_MAP: Record<string, { bg: string; text: string; border: string; bgSoft: string; gradient: string }> = {
  emerald: {
    bg: 'bg-emerald-500',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    bgSoft: 'bg-emerald-100',
    gradient: 'from-emerald-500 to-teal-500',
  },
  violet: {
    bg: 'bg-indigo-600',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    bgSoft: 'bg-indigo-100',
    gradient: 'from-indigo-600 to-purple-600',
  },
  amber: {
    bg: 'bg-amber-500',
    text: 'text-amber-800',
    border: 'border-amber-200',
    bgSoft: 'bg-amber-100',
    gradient: 'from-amber-500 to-orange-500',
  },
  rose: {
    bg: 'bg-rose-500',
    text: 'text-rose-700',
    border: 'border-rose-200',
    bgSoft: 'bg-rose-100',
    gradient: 'from-rose-500 to-pink-500',
  },
  sky: {
    bg: 'bg-sky-500',
    text: 'text-sky-700',
    border: 'border-sky-200',
    bgSoft: 'bg-sky-100',
    gradient: 'from-sky-500 to-blue-500',
  },
  indigo: {
    bg: 'bg-indigo-600',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    bgSoft: 'bg-indigo-100',
    gradient: 'from-indigo-600 to-violet-600',
  },
  teal: {
    bg: 'bg-teal-500',
    text: 'text-teal-800',
    border: 'border-teal-200',
    bgSoft: 'bg-teal-100',
    gradient: 'from-teal-500 to-emerald-500',
  },
  orange: {
    bg: 'bg-orange-500',
    text: 'text-orange-800',
    border: 'border-orange-200',
    bgSoft: 'bg-orange-100',
    gradient: 'from-orange-500 to-amber-500',
  },
};
