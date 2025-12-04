import { render, screen } from '@testing-library/react';
import App from './App';

test('renders game platform title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Game Platform/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders multiplayer games section', () => {
  render(<App />);
  const multiplayerSection = screen.getByText(/Multiplayer Games/i);
  expect(multiplayerSection).toBeInTheDocument();
});

test('renders single player games section', () => {
  render(<App />);
  const singlePlayerSection = screen.getByText(/Single Player Games/i);
  expect(singlePlayerSection).toBeInTheDocument();
});
