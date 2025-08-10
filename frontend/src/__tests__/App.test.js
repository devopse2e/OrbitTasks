// src/__tests__/App.test.js

import React from 'react';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import App from '../App';

describe('App', () => {
  it('renders the app container', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByRole('heading', { name: /Todo/i })).toBeInTheDocument();
    expect(screen.getByText(/stay organized/i)).toBeInTheDocument();
  });
});
