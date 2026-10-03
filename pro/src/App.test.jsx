import { render, screen, within } from '@testing-library/react';
import App from './App';

// Route tests mount the array/linked-list pages, whose GSAP tweens crash on
// framer-motion's inline transforms under jsdom; animation is never asserted.
vi.mock('gsap', () => ({
  gsap: { to: vi.fn(), set: vi.fn(), timeline: vi.fn() },
}));

// Every route the sidebar advertises must resolve to rendered content.
const ADVERTISED_ROUTES = [
  '/',
  '/array',
  '/linked-list',
  '/stack-queue',
  '/tree',
  '/graph',
  '/hash-table',
  '/sorting',
  '/searching',
  '/graph-algo',
  '/dynamic-programming',
  '/greedy',
  '/lessons',
  '/curriculum',
  '/visualizer',
  '/settings',
  '/help',
];

describe('App shell', () => {
  test('renders the home page hero', () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(screen.getByText(/Visualize, Learn, Master/i)).toBeInTheDocument();
  });

  test('renders sidebar navigation to the array visualizer', () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    const links = screen.getAllByRole('link');
    expect(links.some((link) => link.getAttribute('href') === '/array')).toBe(true);
  });
});

describe('route completeness', () => {
  test.each(ADVERTISED_ROUTES)('route %s renders content', (route) => {
    window.history.pushState({}, '', route);
    render(<App />);
    const main = screen.getByRole('main');
    expect(main.textContent.trim().length).toBeGreaterThan(0);
  });

  test('every rendered sidebar link points at a registered route', () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    const nav = screen.getByRole('navigation');
    const hrefs = within(nav)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'));
    expect(hrefs.length).toBeGreaterThan(5);
    hrefs.forEach((href) => {
      expect(ADVERTISED_ROUTES).toContain(href);
    });
  });
});
