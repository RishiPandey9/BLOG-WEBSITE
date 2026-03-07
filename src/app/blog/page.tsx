import { Suspense } from 'react';
import { BlogPageContent } from '@/components/BlogPageContent';

export default function BlogPage() {
  return (
    <div className="pt-24 pb-16">
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 text-center">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        }
      >
        <BlogPageContent />
      </Suspense>
    </div>
  );
}
