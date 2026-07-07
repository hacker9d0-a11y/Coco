import { useEffect, useState } from "react";

export default function USOnlyGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkCountry = async () => {
      try {
        const res = await fetch("https://ipwho.is/");
        const data = await res.json();

        if (data.success && data.country_code === "US") {
          setAllowed(true);
        } else {
          setAllowed(false);
        }
      } catch {
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    checkCountry();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "20px",
        }}
      >
        Verificando ubicación...
      </div>
    );
  }

  if (!allowed) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          background: "#fff",
          color: "#111",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <h1>Access Denied</h1>
        <p>This invitation link is only available in the United States.</p>
      </div>
    );
  }

  return <>{children}</>;
}