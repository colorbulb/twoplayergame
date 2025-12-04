import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

test('renders game platform title', async () => {
  render(<App />);
  await waitFor(() => {
    const titleElement = screen.getByText(/Game Platform/i);
    expect(titleElement).toBeInTheDocument();
  }, { timeout: 3000 });
});

test('renders multiplayer games section', async () => {
  render(<App />);
  await waitFor(() => {
    const multiplayerSection = screen.getByText(/Multiplayer Games/i);
    expect(multiplayerSection).toBeInTheDocument();
  }, { timeout: 3000 });
});

test('renders single player games section', async () => {
  render(<App />);
  await waitFor(() => {
    const singlePlayerSection = screen.getByText(/Single Player Games/i);
    expect(singlePlayerSection).toBeInTheDocument();
  }, { timeout: 3000 });
});
