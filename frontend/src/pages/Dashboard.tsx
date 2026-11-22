
import {
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
  logout,
} from "../services/authService.ts";

import {
  useLanguage,
} from "../i18n/LanguageContext.tsx";

import RestaurantList from
  "../components/RestaurantList.tsx";

import NearbyRestaurantsSection from
  "../components/NearbyRestaurantsSection.tsx";

import RealRecommendationSection from
  "../components/RealRecommendationSection.tsx";

import MyListsSection from
  "../components/MyListsSection.tsx";

import GoogleReviewsSection from
  "../components/GoogleReviewsSection.tsx";

interface User {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  createdAt: string;
}

export default function Dashboard() {
  const { t } = useLanguage();

  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  // Retrieve the authenticated user.
  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((data) => {
        if (!active) return;

        if (!data.user) {
          window.location.replace("/");
          return;
        }

        setUser(data.user);
      })
      .catch(() => {
        if (active) {
          window.location.replace("/");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // End the current FoodieFind session.
  async function handleLogout() {
    try {
      await logout();

      window.location.replace("/");
    } catch {
      window.alert(t("logoutError"));
    }
  }

  if (loading || !user) {
    return (
      <main className="loading-page">
        <p>{t("loading")}</p>
      </main>
    );
  }

  return (
    <div className="app-shell">
      {/* Main navigation */}
      <header className="site-header">
        <a
          className="brand"
          href="/dashboard"
        >
          <span className="brand-symbol">
            F
          </span>

          <span>FoodieFind</span>
        </a>

        <div className="header-actions">
          <div className="user-profile">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="profile-picture"
              />
            ) : (
              <span className="profile-placeholder">
                {user.name
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}

            <span className="profile-name">
              {user.name}
            </span>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={() =>
              void handleLogout()
            }
          >
            {t("logout")}
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Main presentation */}
        <section className="hero">
          <div className="hero-content">
            <span className="hero-eyebrow">
              {t("heroEyebrow")}
            </span>

            <h1>
              {t("heroTitle")}
              <span>
                {t("heroHighlight")}
              </span>
            </h1>

            <p>{t("heroDescription")}</p>

            <a
              className="hero-button"
              href="#explorar"
            >
              {t("exploreButton")}
            </a>
          </div>

          <div
            className="hero-illustration"
            aria-hidden="true"
          >
            <span>🍽️</span>
          </div>
        </section>

        {/* Real personalized recommendations */}
        <RealRecommendationSection />

        {/* Saved real restaurants and personal ratings */}
        <MyListsSection />

        {/* Discover real restaurants */}
        <section
          className="explore-section"
          id="explorar"
        >
          <div className="section-intro">
            <span className="section-eyebrow">
              {t("exploreEyebrow")}
            </span>

            <p>
              {t("exploreDescription")}
            </p>
          </div>

          {/* Main catalog with cuisine and budget filters */}
          <RestaurantList />

          {/* Distance-based nearby discovery */}
          <NearbyRestaurantsSection />

          {/* Google reviews and rating analysis */}
          <GoogleReviewsSection />
        </section>
      </main>

      <footer className="site-footer">
        FoodieFind · {t("footer")}
      </footer>
    </div>
  );
}
