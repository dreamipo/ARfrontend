test('renders correctly', () => {
  const { render } = require('@testing-library/react');
  const App = require('../App').default;
  const { container } = render(<App />);
  expect(container).toBeInTheDocument();
});

test('example test', () => {
  expect(1 + 1).toBe(2);
});