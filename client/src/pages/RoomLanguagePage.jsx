import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../css/RoomLanguagePage.css";

const languages = [
  { code: "bs", label: "Bosanski", flag: "🇧🇦" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
];

export default function RoomLanguagePage() {
  const navigate = useNavigate();
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";
  const [selectedLang, setSelectedLang] = useState("bs");

  const handleContinue = () => {
    navigate(`/t/${tableId}/menu?token=${token}&lang=${selectedLang}`);
  };

  return (
    <div className="langPage">
      <div className="langBgGlow langBgGlow1"></div>
      <div className="langBgGlow langBgGlow2"></div>

      <div className="langCard">
        <div className="langTop">
          <p className="langEyebrow">WELCOME</p>
          <h1 className="langTitle">Soba {tableId}</h1>
          <p className="langSubtitle">
            Odaberite jezik za nastavak.
          </p>
        </div>

        <div className="langOptions">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={`langOption ${selectedLang === lang.code ? "active" : ""}`}
              onClick={() => setSelectedLang(lang.code)}
            >
              <span className="langFlag">{lang.flag}</span>
              <span className="langName">{lang.label}</span>
            </button>
          ))}
        </div>

        <button className="langContinueBtn" onClick={handleContinue}>
          Nastavi
        </button>
      </div>
    </div>
  );
}