'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { List } from 'lucide-react';

interface HeadingEntry {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

function decodeHtmlEntities(input: string): string {
  if (!input) return input;

  const decodeOnce = (value: string): string => {
    if (typeof window !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = value;
      return textarea.value;
    }

    return value
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&#x2F;/gi, '/')
      .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
  };

  let decoded = input;
  for (let i = 0; i < 3; i += 1) {
    const next = decodeOnce(decoded);
    if (next === decoded) break;
    decoded = next;
  }

  return decoded;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

function stripTags(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}

function extractHeadings(content: string): HeadingEntry[] {
  const entries: HeadingEntry[] = [];

  const markdownLines = content.split('\n');
  for (const line of markdownLines) {
    const match = line.match(/^(#{1,3})\s+(.+)/);
    if (!match) continue;
    const level = match[1].length;
    const text = match[2].trim();
    entries.push({ id: slugify(text), text, level });
  }

  if (entries.length > 0) {
    return entries;
  }

  const htmlHeadingRegex = /<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/gi;
  let htmlMatch: RegExpExecArray | null;
  while ((htmlMatch = htmlHeadingRegex.exec(content)) !== null) {
    const level = Number(htmlMatch[1].replace('h', ''));
    const text = stripTags(htmlMatch[2]);
    if (!text) continue;
    entries.push({ id: slugify(text), text, level });
  }

  return entries;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState('');
  const normalizedContent = decodeHtmlEntities(content);
  const headings = extractHeadings(normalizedContent);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0% -60% 0%' }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <div className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <List className="w-4 h-4 text-sky-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
          Table of Contents
        </h3>
      </div>
      <nav>
        <ul className="space-y-1.5">
          {headings.map(({ id, text, level }) => (
            <li
              key={id}
              style={{ paddingLeft: `${(level - 1) * 12}px` }}
            >
              <a
                href={`#${id}`}
                className={cn(
                  'block text-sm py-0.5 transition-colors duration-150 hover:text-sky-500 dark:hover:text-sky-400',
                  activeId === id
                    ? 'text-sky-500 dark:text-sky-400 font-medium'
                    : 'text-gray-600 dark:text-gray-600'
                )}
              >
                {text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
