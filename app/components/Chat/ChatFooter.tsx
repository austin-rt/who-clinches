interface ChatFooterProps {
  authToast: string | null;
  providerLimit: boolean;
  windowResetsAt: number | null;
  countdown: string;
  email: string | null;
  authEmail: string;
  authSending: boolean;
  authSent: boolean;
  devVerifyUrl: string | null;
  isMaintainer: boolean;
  usage: { freeRemaining: number; creditsRemaining: number } | null;
  onAuthEmailChange: (email: string) => void;
  onSendMagicLink: () => void;
}

const AuthToast = ({ message }: { message: string | null }) => {
  if (!message) return null;

  return (
    <div
      className="border-t border-base-300 px-4 py-2 text-center text-xs text-success"
      data-testid="auth-toast"
    >
      {message}
    </div>
  );
};

const ProviderLimitNotice = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;

  return (
    <div
      className="border-t border-base-300 px-4 py-3 text-center text-xs text-warning"
      data-testid="provider-limit-notice"
    >
      The AI is temporarily unavailable — a service-wide limit, not yours. Your credits are safe.
      Try again in a few minutes.
    </div>
  );
};

const SignInForm = ({
  authEmail,
  authSending,
  authSent,
  devVerifyUrl,
  onAuthEmailChange,
  onSendMagicLink,
}: {
  authEmail: string;
  authSending: boolean;
  authSent: boolean;
  devVerifyUrl: string | null;
  onAuthEmailChange: (email: string) => void;
  onSendMagicLink: () => void;
}) => {
  if (authSent) {
    return (
      <div className="space-y-1 text-center">
        <p className="text-xs text-success">Check your email for a sign-in link.</p>
        {devVerifyUrl && (
          <a href={devVerifyUrl} className="text-xs text-primary underline">
            Dev: click to verify
          </a>
        )}
      </div>
    );
  }

  return (
    <>
      <p className="text-base-content/50 text-center text-xs">
        Want more? Sign in to link donations.
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          value={authEmail}
          onChange={(e) => onAuthEmailChange(e.target.value)}
          placeholder="Email"
          className="flex-1 rounded-md border border-base-300 bg-base-100 px-3 py-1.5 text-sm"
        />
        <button
          onClick={onSendMagicLink}
          disabled={authSending || !authEmail}
          className="btn btn-primary btn-sm whitespace-nowrap rounded-md"
        >
          {authSending ? '...' : 'Send link'}
        </button>
      </div>
    </>
  );
};

const WindowRateLimit = ({
  windowResetsAt,
  providerLimit,
  countdown,
  email,
  authEmail,
  authSending,
  authSent,
  devVerifyUrl,
  onAuthEmailChange,
  onSendMagicLink,
}: {
  windowResetsAt: number | null;
  providerLimit: boolean;
  countdown: string;
  email: string | null;
  authEmail: string;
  authSending: boolean;
  authSent: boolean;
  devVerifyUrl: string | null;
  onAuthEmailChange: (email: string) => void;
  onSendMagicLink: () => void;
}) => {
  if (!windowResetsAt || providerLimit) return null;

  return (
    <div className="space-y-3 border-t border-base-300 px-4 py-3" data-testid="rate-limit-section">
      <p className="text-base-content/60 text-center text-xs">
        Free messages reset in {countdown}.
      </p>
      {!email ? (
        <div className="space-y-2">
          <SignInForm
            authEmail={authEmail}
            authSending={authSending}
            authSent={authSent}
            devVerifyUrl={devVerifyUrl}
            onAuthEmailChange={onAuthEmailChange}
            onSendMagicLink={onSendMagicLink}
          />
          <a
            href="https://buymeacoffee.com/whoclinches"
            target="_blank"
            rel="noopener noreferrer"
            className="text-base-content/50 block text-center text-xs underline"
          >
            Support on Buy Me a Coffee
          </a>
        </div>
      ) : (
        <div className="text-center">
          <a
            href="https://buymeacoffee.com/whoclinches"
            target="_blank"
            rel="noopener noreferrer"
            className="text-base-content/50 text-xs underline"
          >
            Get more credits on Buy Me a Coffee
          </a>
        </div>
      )}
    </div>
  );
};

const MaintainerBadge = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;

  return (
    <div
      className="border-t border-base-300 px-4 py-1 text-center text-[10px] text-success"
      data-testid="maintainer-badge"
    >
      Maintainer mode
    </div>
  );
};

const UsageDisplay = ({
  usage,
  windowResetsAt,
  providerLimit,
  isMaintainer,
  countdown,
}: {
  usage: { freeRemaining: number; creditsRemaining: number } | null;
  windowResetsAt: number | null;
  providerLimit: boolean;
  isMaintainer: boolean;
  countdown: string;
}) => {
  if (!usage || windowResetsAt || providerLimit || isMaintainer) return null;

  return (
    <div
      className="flex flex-col items-center border-t border-base-300 px-4 py-1"
      data-testid="usage-display"
    >
      <div className="text-base-content/40 flex items-center gap-1.5 text-[10px]">
        <span>Remaining Messages:</span>
        {usage.creditsRemaining > 0 ? (
          <>
            <span>{usage.freeRemaining}/8 free</span>
            <span>{usage.creditsRemaining} donation</span>
          </>
        ) : (
          <span>{usage.freeRemaining}/8</span>
        )}
        {countdown && <span>— resets in {countdown}</span>}
      </div>
      {usage.freeRemaining === 0 && usage.creditsRemaining === 0 && (
        <p className="text-base-content/40 text-[10px]">
          You&apos;ve run out of free messages. If you don&apos;t want to wait, you can{' '}
          <a
            href="https://buymeacoffee.com/whoclinches"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            donate to server costs here
          </a>{' '}
          and you&apos;ll regain immediate access.
        </p>
      )}
    </div>
  );
};

const ChatFooter = ({
  authToast,
  providerLimit,
  windowResetsAt,
  countdown,
  email,
  authEmail,
  authSending,
  authSent,
  devVerifyUrl,
  isMaintainer,
  usage,
  onAuthEmailChange,
  onSendMagicLink,
}: ChatFooterProps) => (
  <>
    <AuthToast message={authToast} />
    <ProviderLimitNotice visible={providerLimit} />
    <WindowRateLimit
      windowResetsAt={windowResetsAt}
      providerLimit={providerLimit}
      countdown={countdown}
      email={email}
      authEmail={authEmail}
      authSending={authSending}
      authSent={authSent}
      devVerifyUrl={devVerifyUrl}
      onAuthEmailChange={onAuthEmailChange}
      onSendMagicLink={onSendMagicLink}
    />
    <MaintainerBadge visible={isMaintainer} />
    <UsageDisplay
      usage={usage}
      windowResetsAt={windowResetsAt}
      providerLimit={providerLimit}
      isMaintainer={isMaintainer}
      countdown={countdown}
    />
  </>
);

export default ChatFooter;
