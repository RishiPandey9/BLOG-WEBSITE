import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from '../Navbar';
import '@testing-library/jest-dom';

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/'
  })
}));

// Mock next-auth/react
const { mockSignIn, mockSignOut, mockUseSession } = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
  mockSignOut: vi.fn(),
  mockUseSession: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
  signIn: mockSignIn,
  signOut: mockSignOut
}));

// Mock next-themes
const { mockUseTheme } = vi.hoisted(() => ({
  mockUseTheme: vi.fn().mockReturnValue({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

vi.mock('next-themes', () => ({
  useTheme: () => mockUseTheme()
}));

// Mock useRole hook
const { mockUseRole } = vi.hoisted(() => ({
  mockUseRole: vi.fn().mockReturnValue({
    isManager: false,
    label: 'Viewer',
  }),
}));

vi.mock('@/hooks/useRole', () => ({
  useRole: () => mockUseRole()
}));

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
    default: ({ children, href, ...props }: any) => {
      return <a href={href} {...props}>{children}</a>;
    }
  };
});

// Mock Lucide icons
vi.mock('lucide-react', () => {
  return {
    Sun: () => <svg data-testid="sun-icon" />,
    Moon: () => <svg data-testid="moon-icon" />,
    Menu: () => <svg data-testid="menu-icon" />,
    X: () => <svg data-testid="x-icon" />,
    PenSquare: () => <svg data-testid="pen-icon" />,
    LogIn: () => <svg data-testid="login-icon" />,
    LogOut: () => <svg data-testid="logout-icon" />,
    BookOpen: () => <svg data-testid="book-icon" />,
    Sparkles: () => <svg data-testid="sparkles-icon" />,
    ChevronDown: () => <svg data-testid="chevron-down-icon" />,
    Shield: () => <svg data-testid="shield-icon" />,
    LayoutDashboard: () => <svg data-testid="dashboard-icon" />,
    Bookmark: () => <svg data-testid="bookmark-icon" />
  };
});

// Mock UI components
vi.mock('@/components/ui/button', () => {
  return {
    Button: ({ children, onClick, asChild, ...props }: any) => {
      if (asChild) {
        const child = Array.isArray(children) ? children[0] : children;
        if (child?.type === 'a') {
          return <a onClick={onClick} {...child.props} {...props}>{child.props.children}</a>;
        }
        return <button onClick={onClick} {...props}>{children}</button>;
      }
      return <button onClick={onClick} {...props}>{children}</button>;
    }
  };
});

vi.mock('@/components/ui/avatar', () => {
  return {
    Avatar: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    AvatarFallback: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    AvatarImage: ({ ...props }: any) => <img {...props} />
  };
});

vi.mock('@/components/ui/badge', () => {
  return {
    Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>
  };
});

// Mock utils
vi.mock('@/lib/utils', () => {
  return {
    cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ')
  };
});

describe('Navbar Component', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock window.scrollTo
    Object.defineProperty(window, 'scrollTo', { value: vi.fn() });

    // Mock window.addEventListener
    Object.defineProperty(window, 'addEventListener', { value: vi.fn() });
    Object.defineProperty(window, 'removeEventListener', { value: vi.fn() });

    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  });

  it('should render logo and site name', () => {
    mockUseSession.mockReturnValue({ data: null });

    render(<Navbar />);

    expect(screen.getByText('DevBlog')).toBeInTheDocument();
    expect(screen.getByTestId('book-icon')).toBeInTheDocument();
  });

  it('should render navigation links for desktop', () => {
    mockUseSession.mockReturnValue({ data: null });

    render(<Navbar />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Blog')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Tutorials')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('should show sign in button when user is not logged in', () => {
    mockUseSession.mockReturnValue({ data: null });

    render(<Navbar />);

    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByTestId('login-icon')).toBeInTheDocument();
  });

  it('should show user menu when user is logged in', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: 'Test User',
          email: 'test@example.com',
          image: 'https://example.com/avatar.jpg'
        }
      }
    });

    render(<Navbar />);

    expect(screen.getByLabelText('Test User menu')).toBeInTheDocument();
    expect(screen.getByText('Write')).toBeInTheDocument();
  });

  it('should show admin panel link for managers', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: 'Admin User',
          email: 'admin@example.com'
        }
      }
    });

    mockUseRole.mockReturnValue({
      isManager: true,
      label: 'Admin'
    });

    render(<Navbar />);

    // Open user menu
    fireEvent.click(screen.getByLabelText('Admin User menu'));

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
  });

  it('should not show admin panel link for non-managers', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: 'Regular User',
          email: 'user@example.com'
        }
      }
    });

    mockUseRole.mockReturnValue({
      isManager: false,
      label: 'Viewer'
    });

    render(<Navbar />);

    // Open user menu
    fireEvent.click(screen.getByLabelText('Regular User menu'));

    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
  });

  it('should toggle mobile menu when menu button is clicked', () => {
    mockUseSession.mockReturnValue({ data: null });

    render(<Navbar />);

    // Desktop has one Sign In link by default; mobile menu adds another when opened.
    expect(screen.getAllByText('Sign In')).toHaveLength(1);

    // Click menu button
    fireEvent.click(screen.getByTestId('menu-icon'));

    // Now mobile menu should be visible
    expect(screen.getAllByText('Sign In').length).toBeGreaterThan(1);

    // Click close button
    fireEvent.click(screen.getByTestId('x-icon'));

    // Mobile menu should be hidden again
    expect(screen.getAllByText('Sign In')).toHaveLength(1);
  });

  it('should call signOut when sign out button is clicked', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: 'Test User',
          email: 'test@example.com'
        }
      }
    });

    render(<Navbar />);

    // Open user menu
    fireEvent.click(screen.getByLabelText('Test User menu'));

    // Click sign out button
    fireEvent.click(screen.getByText('Sign Out'));

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('should call signIn when sign in button is clicked', () => {
    mockUseSession.mockReturnValue({ data: null });

    render(<Navbar />);

    fireEvent.click(screen.getByText('Sign In'));

    expect(mockSignIn).toHaveBeenCalled();
  });

  it('should toggle theme when theme button is clicked', () => {
    mockUseSession.mockReturnValue({ data: null });
    const setThemeMock = vi.fn();
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: setThemeMock
    });

    render(<Navbar />);

    fireEvent.click(screen.getByLabelText('Toggle theme'));

    expect(setThemeMock).toHaveBeenCalledWith('dark');
  });
});