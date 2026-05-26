/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import chatReducer from '@/app/store/chatSlice';
import UserMenu from '@/app/components/Layout/UserMenu';

const createStore = (email: string | null = null) =>
  configureStore({
    reducer: { chat: chatReducer },
    preloadedState: {
      chat: {
        sessions: [],
        activeSessionIndex: 0,
        email,
        usage: null,
        history: [],
        drawerOpen: false,
      },
    },
  });

const renderWithStore = (email: string | null = null) => {
  const store = createStore(email);
  return render(
    <Provider store={store}>
      <UserMenu isNonProd={false} />
    </Provider>
  );
};

describe('UserMenu', () => {
  it('renders sign-in button when not authenticated', () => {
    renderWithStore();
    expect(screen.getByLabelText('Sign in')).toBeInTheDocument();
  });

  it('renders user menu button when authenticated', () => {
    renderWithStore('user@test.com');
    expect(screen.getByLabelText('User menu')).toBeInTheDocument();
  });

  it('shows email input popover on click when not authenticated', () => {
    renderWithStore();
    fireEvent.click(screen.getByLabelText('Sign in'));
    expect(screen.getByPlaceholderText('Sign in with email')).toBeInTheDocument();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('shows email and sign out dropdown on click when authenticated', () => {
    renderWithStore('user@test.com');
    fireEvent.click(screen.getByLabelText('User menu'));
    expect(screen.getByText('user@test.com')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('hides popover when not clicked', () => {
    renderWithStore();
    expect(screen.queryByPlaceholderText('Sign in with email')).not.toBeInTheDocument();
  });

  it('hides dropdown when not clicked', () => {
    renderWithStore('user@test.com');
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
  });

  it('disables submit when email input is empty', () => {
    renderWithStore();
    fireEvent.click(screen.getByLabelText('Sign in'));
    const submitBtn = screen.getAllByText('Sign in').find((el) => el.closest('form'));
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit when email input has value', () => {
    renderWithStore();
    fireEvent.click(screen.getByLabelText('Sign in'));
    fireEvent.change(screen.getByPlaceholderText('Sign in with email'), {
      target: { value: 'test@example.com' },
    });
    const buttons = screen.getAllByText('Sign in');
    const submitBtn = buttons.find((b) => b.tagName === 'BUTTON' && b.closest('form'));
    expect(submitBtn).not.toBeDisabled();
  });
});
