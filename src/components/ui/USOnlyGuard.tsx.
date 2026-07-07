import { useEffect, useState } from 'react';

export default function USOnlyGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://ipwho.is/')
      .then(r => r.json())
      .then(d => setOk(d.success && d.country_code === 'US'))
      .catch(() => setOk(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Verificando ubicación...</div>;

  if (!ok) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h1>Access denied</h1>
        <p>This invitation link is only available in the United States.</p>
      </div>
    );
  }

  return <>{children}</>;
}