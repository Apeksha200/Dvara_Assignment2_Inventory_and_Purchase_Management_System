import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders login page by default or redirects', () => {
    render(<App />);
    // Check for "Sign In" button or "Inventory Manager" title which are on the Login page
    // Since we redirect to /login if not authenticated
    const titleElement = screen.getByRole('heading', { name: /inventory manager/i }); 
    expect(titleElement).toBeInTheDocument();
  });
});
