import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../css/RoomLanguagePage.css";

const languages = [
  { code: "bs", label: "Bosanski", sub: "BHS" },
  { code: "en", label: "English", sub: "ENG" },
  { code: "de", label: "Deutsch", sub: "DE" },
];

export default function RoomLanguagePage() {
  const navigate = useNavigate();
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";
  const [selectedLang, setSelectedLang] = useState("bs");

  const roomLabel = useMemo(() => `Soba ${tableId}`, [tableId]);

  const handleContinue = () => {
    navigate(`/t/${tableId}/home?token=${token}&lang=${selectedLang}`);
  };

  return (
    <div className="roomLangPage">
      <div className="roomLangGlow roomLangGlow1"></div>
      <div className="roomLangGlow roomLangGlow2"></div>

      <div className="roomLangCard">
        <div className="roomLangTop">
          <div>
            <p className="roomLangEyebrow">DOBRODOŠLI / WELCOME</p>
            <h1 className="roomLangTitle">{roomLabel}</h1>
            <p className="roomLangSubtitle">
              Odaberite jezik kako biste nastavili na meni i hotelske usluge.
            </p>
          </div>

          <div className="roomLangBadge">Tap2Order</div>
        </div>

        <div className="roomLangSection">
          <h2 className="roomLangSectionTitle">Odaberite jezik</h2>

          <div className="roomLangGrid">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                className={`roomLangOption ${
                  selectedLang === lang.code ? "active" : ""
                }`}
                onClick={() => setSelectedLang(lang.code)}
              >
                <span className="roomLangOptionTop">{lang.label}</span>
                <span className="roomLangOptionBottom">{lang.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="roomLangBottom">
          <p className="roomLangHint">
            Nakon odabira jezika, gost bira da li želi meni ili hotelske usluge.
          </p>

          <button
            type="button"
            className="roomLangContinueBtn"
            onClick={handleContinue}
          >
            Nastavi
          </button>
        </div>
      </div>
    </div>
  );
}