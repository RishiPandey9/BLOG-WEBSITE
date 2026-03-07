'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check } from 'lucide-react';

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback — silent fail
    }
  };

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy code"
      className="absolute top-3 right-3 p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

interface BlogContentProps {
  content: string;
}

export function BlogContent({ content }: BlogContentProps) {
  return (
    <article className="prose prose-lg prose-gray dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-code:text-sky-600 dark:prose-code:text-sky-400 prose-pre:bg-gray-900 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-800 prose-pre:rounded-xl prose-a:text-sky-500 hover:prose-a:text-sky-600 prose-blockquote:border-sky-500 prose-img:rounded-xl">
      <ReactMarkdown
        components={{
          h1: ({ children }) => {
            const text = String(children);
            const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
            return <h1 id={id} className="text-3xl md:text-4xl font-extrabold mt-10 mb-4">{children}</h1>;
          },
          h2: ({ children }) => {
            const text = String(children);
            const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
            return (
              <h2 id={id} className="text-2xl md:text-3xl font-bold mt-8 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                {children}
              </h2>
            );
          },
          h3: ({ children }) => {
            const text = String(children);
            const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
            return <h3 id={id} className="text-xl md:text-2xl font-semibold mt-6 mb-2">{children}</h3>;
          },
          p: ({ children }) => (
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{children}</p>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <code className={`${className} text-sm`}>{children}</code>
              );
            }
            return (
              <code className="px-1.5 py-0.5 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-md text-sm font-mono">
                {children}
              </code>
            );
          },
          pre: ({ children }) => {
            // Extract raw code text for the copy button
            const codeElement = (children as React.ReactElement)?.props;
            const rawCode = typeof codeElement?.children === 'string' ? codeElement.children : '';
            return (
              <div className="relative group my-6">
                <pre className="bg-gray-900 dark:bg-gray-800 text-gray-100 border border-gray-700 rounded-xl p-4 overflow-x-auto text-sm">
                  {children}
                </pre>
                <CopyButton code={rawCode} />
              </div>
            );
          },
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-2 mb-4 text-gray-600 dark:text-gray-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-600 dark:text-gray-300">
              {children}
            </ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-sky-500 bg-sky-50 dark:bg-sky-900/10 pl-4 py-2 my-6 italic text-gray-600 dark:text-gray-400 rounded-r-lg">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 underline decoration-sky-500/30 hover:decoration-sky-500 transition-all"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}

