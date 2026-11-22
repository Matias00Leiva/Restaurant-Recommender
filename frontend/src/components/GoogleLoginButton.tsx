
import {
  useLanguage,
} from "../i18n/LanguageContext.tsx";

export default function GoogleLoginButton() {
  const { t } = useLanguage();

  // Start OAuth through the current website origin.
  return (
    <a href="/api/auth/google">
      {t("googleButton")}
    </a>
  );
}
