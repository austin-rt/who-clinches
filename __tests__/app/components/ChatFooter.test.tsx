/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import ChatFooter from '@/app/components/Chat/ChatFooter';

const baseProps = {
  authToast: null,
  providerLimit: false,
  windowResetsAt: null,
  countdown: '',
  email: null,
  authEmail: '',
  authSending: false,
  authSent: false,
  devVerifyUrl: null,
  isMaintainer: false,
  usage: null,
  onAuthEmailChange: jest.fn(),
  onSendMagicLink: jest.fn(),
};

describe('ChatFooter', () => {
  it('renders auth toast when message is present', () => {
    render(<ChatFooter {...baseProps} authToast="Email verified!" />);
    expect(screen.getByText('Email verified!')).toBeInTheDocument();
  });

  it('hides auth toast when null', () => {
    const { container } = render(<ChatFooter {...baseProps} />);
    expect(container.textContent).not.toContain('Email verified');
  });

  it('renders provider limit notice when providerLimit is true', () => {
    render(<ChatFooter {...baseProps} providerLimit={true} />);
    expect(screen.getByText(/temporarily unavailable/)).toBeInTheDocument();
  });

  it('hides provider limit notice when providerLimit is false', () => {
    const { container } = render(<ChatFooter {...baseProps} />);
    expect(container.textContent).not.toContain('temporarily unavailable');
  });

  it('renders rate limit section with sign-in form when windowResetsAt is set and no email', () => {
    render(<ChatFooter {...baseProps} windowResetsAt={Date.now() + 60000} countdown="1m 0s" />);
    expect(screen.getByText(/Free messages reset in/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByText('Send link')).toBeInTheDocument();
  });

  it('renders BMC link for signed-in users when rate limited', () => {
    render(
      <ChatFooter
        {...baseProps}
        windowResetsAt={Date.now() + 60000}
        countdown="1m 0s"
        email="user@test.com"
      />
    );
    expect(screen.getByText(/Free messages reset in/)).toBeInTheDocument();
    expect(screen.getByText('Get more credits on Buy Me a Coffee')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Email')).not.toBeInTheDocument();
  });

  it('shows confirmation message after auth link is sent', () => {
    render(
      <ChatFooter
        {...baseProps}
        windowResetsAt={Date.now() + 60000}
        countdown="1m 0s"
        authSent={true}
      />
    );
    expect(screen.getByText(/Check your email/)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Email')).not.toBeInTheDocument();
  });

  it('hides rate limit section when providerLimit overrides windowResetsAt', () => {
    const { container } = render(
      <ChatFooter
        {...baseProps}
        windowResetsAt={Date.now() + 60000}
        countdown="1m 0s"
        providerLimit={true}
      />
    );
    expect(container.textContent).not.toContain('Free messages reset in');
  });

  it('renders maintainer badge when isMaintainer is true', () => {
    render(<ChatFooter {...baseProps} isMaintainer={true} />);
    expect(screen.getByText('Maintainer mode')).toBeInTheDocument();
  });

  it('hides maintainer badge when isMaintainer is false', () => {
    const { container } = render(<ChatFooter {...baseProps} />);
    expect(container.textContent).not.toContain('Maintainer mode');
  });

  it('renders usage with both free and donation credits', () => {
    render(<ChatFooter {...baseProps} usage={{ freeRemaining: 3, creditsRemaining: 5 }} />);
    expect(screen.getByText('3/8 free')).toBeInTheDocument();
    expect(screen.getByText('5 donation')).toBeInTheDocument();
  });

  it('renders usage with free credits only when no donations', () => {
    render(<ChatFooter {...baseProps} usage={{ freeRemaining: 6, creditsRemaining: 0 }} />);
    expect(screen.getByText('6/8')).toBeInTheDocument();
    expect(screen.queryByText(/donation/)).not.toBeInTheDocument();
  });

  it('shows out-of-messages notice when both free and credits are zero', () => {
    render(<ChatFooter {...baseProps} usage={{ freeRemaining: 0, creditsRemaining: 0 }} />);
    expect(screen.getByText(/run out of free messages/)).toBeInTheDocument();
  });

  it('hides usage when windowResetsAt is active', () => {
    const { container } = render(
      <ChatFooter
        {...baseProps}
        usage={{ freeRemaining: 5, creditsRemaining: 0 }}
        windowResetsAt={Date.now() + 60000}
        countdown="1m 0s"
      />
    );
    expect(container.textContent).not.toContain('Remaining Messages');
  });

  it('hides usage when isMaintainer is true', () => {
    const { container } = render(
      <ChatFooter
        {...baseProps}
        usage={{ freeRemaining: 5, creditsRemaining: 0 }}
        isMaintainer={true}
      />
    );
    expect(container.textContent).not.toContain('Remaining Messages');
  });

  it('shows dev verify link when devVerifyUrl is set and auth sent', () => {
    render(
      <ChatFooter
        {...baseProps}
        windowResetsAt={Date.now() + 60000}
        countdown="1m 0s"
        authSent={true}
        devVerifyUrl="http://localhost:3000/auth/verify?token=abc"
      />
    );
    expect(screen.getByText('Dev: click to verify')).toBeInTheDocument();
  });
});
