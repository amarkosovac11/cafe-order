import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../css/HotelServicesPage.css";

const serviceCategories = [
  { id: "massage", name: "Masaža", count: 0 },
  { id: "quad", name: "Quad", count: 0 },
];

export default function HotelServicesPage() {
  const navigate = useNavigate();
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";
  const lang = searchParams.get("lang") || "bs";

  const handleCategoryClick = (categoryId) => {
    navigate(`/t/${tableId}/services/${categoryId}?token=${token}&lang=${lang}`);
  };

  return (
    <div className="hotelServicesPage">
      <div className="hotelServicesContainer">
        <section className="hotelServicesHero">
          <div className="hotelServicesHeroLeft">
            <p className="hotelServicesEyebrow">HOTELSKE USLUGE</p>
            <h1 className="hotelServicesRoomTitle">Soba {tableId}</h1>
            <p className="hotelServicesSubtitle">
              Pregledajte dostupne hotelske usluge i pošaljite zahtjev.
            </p>
          </div>

          <div className="hotelServicesHeroRight">
            <button
              className="hotelServicesStaffBtn"
              type="button"
              onClick={() => navigate(`/t/${tableId}/menu?token=${token}&lang=${lang}`)}
            >
              Nazad na meni
            </button>

            <select
              className="hotelServicesLangSelect"
              value={lang}
              onChange={(e) => {
                navigate(
                  `/t/${tableId}/services?token=${token}&lang=${e.target.value}`
                );
              }}
            >
              <option value="bs">Bosnian</option>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </section>

        <section className="hotelServicesMenuCard">
          <div className="hotelServicesMenuHeader">
            <h2 className="hotelServicesMenuTitle">Hotelske usluge</h2>
            <div className="hotelServicesBadge">
              {serviceCategories.length} ukupno
            </div>
          </div>

          <div className="hotelServicesGrid">
            {serviceCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                className="hotelServicesCategoryCard"
                onClick={() => handleCategoryClick(category.id)}
              >
                <span className="hotelServicesCategoryName">{category.name}</span>
                <span className="hotelServicesCategoryCount">
                  {category.count} artikala
                </span>
              </button>
            ))}
          </div>
        </section>

        <p className="hotelServicesBottomNote">
          Odaberite kategoriju kako biste vidjeli dostupne usluge.
        </p>
      </div>
    </div>
  );
}