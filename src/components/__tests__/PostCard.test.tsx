import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostCard } from '../PostCard';
import type { BlogPost } from '../../types';
import '@testing-library/jest-dom';

// Mock next/image since it requires a Next.js environment
vi.mock('next/image', () => {
  return {
    default: ({ alt, ...props }: any) => {
      return <img alt={alt} {...props} />;
    }
  };
});

// Mock next/link since it requires a Next.js environment
vi.mock('next/link', () => {
  return {
    default: ({ children, ...props }: any) => {
      return <a {...props}>{children}</a>;
    }
  };
});

// Mock framer-motion since it's not compatible with JSDOM
vi.mock('framer-motion', () => {
  return {
    motion: {
      article: ({ children, ...props }: any) => <article {...props}>{children}</article>
    }
  };
});

// Mock Lucide icons
vi.mock('lucide-react', () => {
  return {
    Clock: () => <svg data-testid="clock-icon" />,
    Heart: () => <svg data-testid="heart-icon" />,
    Eye: () => <svg data-testid="eye-icon" />,
    ArrowUpRight: () => <svg data-testid="arrow-icon" />,
    MessageSquare: () => <svg data-testid="message-icon" />,
    Star: () => <svg data-testid="star-icon" />,
    Lock: () => <svg data-testid="lock-icon" />
  };
});

// Mock Badge component
vi.mock('@/components/ui/badge', () => {
  return {
    Badge: ({ children, className, ...props }: any) => (
      <span className={className} {...props}>{children}</span>
    )
  };
});

// Mock utils
vi.mock('@/lib/utils', () => {
  return {
    formatDate: vi.fn().mockReturnValue('Jan 1, 2023'),
    categoryColors: {
      Technology: 'bg-blue-100'
    },
    cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ')
  };
});

describe('PostCard Component', () => {
  const mockPost: BlogPost = {
    id: '1',
    slug: 'test-post',
    title: 'Test Post Title',
    excerpt: 'This is a test post excerpt',
    content: 'This is the full content of the test post',
    coverImage: 'https://example.com/image.jpg',
    category: 'Technology',
    tags: ['react', 'typescript', 'testing'],
    author: {
      name: 'Test Author',
      username: 'testauthor',
      email: 'test@example.com',
      avatar: 'https://example.com/avatar.jpg',
      bio: 'Test author bio'
    },
    publishedAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    readingTime: 5,
    likes: 10,
    views: 100,
    commentCount: 5,
    featured: false,
    status: 'published'
  };

  it('should render post title correctly', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
  });

  it('should render post excerpt correctly', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('This is a test post excerpt')).toBeInTheDocument();
  });

  it('should render author name correctly', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });

  it('should render reading time correctly', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('5 min read')).toBeInTheDocument();
  });

  it('should render likes count correctly', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should render views count correctly', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should render comment count correctly', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should render category correctly', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('Technology')).toBeInTheDocument();
  });

  it('should render tags correctly', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('#react')).toBeInTheDocument();
    expect(screen.getByText('#typescript')).toBeInTheDocument();
    expect(screen.getByText('#testing')).toBeInTheDocument();
  });

  it('should render featured badge for featured posts', () => {
    const featuredPost = { ...mockPost, featured: true };
    render(<PostCard post={featuredPost} />);

    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('should not render featured badge for non-featured posts', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.queryByText('Featured')).not.toBeInTheDocument();
  });

  it('should render premium badge for premium posts', () => {
    const premiumPost = { ...mockPost, isPremium: true };
    render(<PostCard post={premiumPost} />);

    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('should not render premium badge for non-premium posts', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.queryByText('Premium')).not.toBeInTheDocument();
  });

  it('should render status badge for non-published posts', () => {
    const draftPost = { ...mockPost, status: 'draft' as const };
    render(<PostCard post={draftPost} />);

    expect(screen.getByText('📝 Draft')).toBeInTheDocument();
  });

  it('should not render status badge for published posts', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.queryByText('📝 Draft')).not.toBeInTheDocument();
    expect(screen.queryByText('⏳ In Review')).not.toBeInTheDocument();
    expect(screen.queryByText('❌ Rejected')).not.toBeInTheDocument();
  });

  it('should render correct link for post', () => {
    render(<PostCard post={mockPost} />);

    const link = screen.getByText('Test Post Title').closest('a');
    expect(link).toHaveAttribute('href', '/blog/test-post');
  });

  it('should render author profile link correctly', () => {
    render(<PostCard post={mockPost} />);

    const authorLink = screen.getByText('Test Author').closest('a');
    expect(authorLink).toHaveAttribute('href', '/u/testauthor');
  });

  it('should render featured layout when featured prop is true', () => {
    const featuredPost = { ...mockPost, featured: true };
    render(<PostCard post={featuredPost} featured={true} />);

    // Just check that it renders without error
    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
  });
});