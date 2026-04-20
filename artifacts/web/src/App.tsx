export default function App() {
  return (
    <div>
      <h1>Hello World</h1>

      <a
        href="https://wa.me/39IL_TUO_NUMERO"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          backgroundColor: "#22c55e",
          color: "#ffffff",
          padding: "1rem",
          borderRadius: "9999px",
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
          transition: "background-color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#22c55e")}
      >
        <i className="fab fa-whatsapp fa-2x"></i>
      </a>
    </div>
  );
}
