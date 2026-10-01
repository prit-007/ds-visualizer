import { render, screen, fireEvent } from '@testing-library/react';
import TabNavigation from './TabNavigation';

const TABS = [
  { id: 'insert', label: 'Insert' },
  { id: 'delete', label: 'Delete' },
  { id: 'search', label: 'Search' },
];

describe('TabNavigation', () => {
  test('renders every tab label', () => {
    render(<TabNavigation tabs={TABS} activeTab="insert" onTabChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Insert' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  test('reports the clicked tab id', () => {
    const onTabChange = vi.fn();
    render(<TabNavigation tabs={TABS} activeTab="insert" onTabChange={onTabChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onTabChange).toHaveBeenCalledWith('delete');
    expect(onTabChange).toHaveBeenCalledTimes(1);
  });

  test('marks the active tab', () => {
    render(<TabNavigation tabs={TABS} activeTab="delete" onTabChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Delete' }).className).toContain('active');
    expect(screen.getByRole('button', { name: 'Insert' }).className).not.toContain('active');
  });

  test('disables all tabs while animating', () => {
    render(<TabNavigation tabs={TABS} activeTab="insert" onTabChange={() => {}} disabled />);
    TABS.forEach((tab) => {
      expect(screen.getByRole('button', { name: tab.label })).toBeDisabled();
    });
  });

  test('renders no buttons when tabs are omitted', () => {
    render(<TabNavigation onTabChange={() => {}} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
