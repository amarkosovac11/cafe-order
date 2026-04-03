import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../css/RoomChoicePage.css";

export default function RoomLanguagePage() {
  const navigate = useNavigate();
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";
  const initialLang = searchParams.get("lang") || "bs";
  const [selectedLang, setSelectedLang] = useState(initialLang);

  const goToMenu = () => {
    navigate(`/t/${tableId}/menu?token=${token}&lang=${selectedLang}`);
  };

  const goToServices = () => {
    navigate(`/t/${tableId}/services?token=${token}&lang=${selectedLang}`);
  };

  return (
    <div className="choicePage">
      <div className="choiceBgGlow choiceBgGlow1"></div>
      <div className="choiceBgGlow choiceBgGlow2"></div>

      <div className="choiceCard">
        <div className="choiceTopRow">
          <div className="choiceTopText">
            <p className="choiceEyebrow">WELCOME</p>
            <h1 className="choiceTitle">Soba {tableId}</h1>
            <p className="choiceSubtitle">
              Odaberite željenu opciju za nastavak.
            </p>
          </div>

          <div className="choiceLangWrap">
            <select
              className="choiceLangSelect"
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
            >
              <option value="bs">Bosnian</option>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </div>

        <div className="choiceGrid">
          <button type="button" className="choiceOption" onClick={goToMenu}>
            <span className="choiceOptionLabel">Meni</span>
            <span className="choiceOptionText">
              Pregled hrane, pića i room service ponude.
            </span>
          </button>

          <button type="button" className="choiceOption" onClick={goToServices}>
            <span className="choiceOptionLabel">Hotelske usluge</span>
            <span className="choiceOptionText">
              Masaže, quad, wellness i ostale dodatne usluge.
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}