export const cookiePreferenceName = "responku_cookie_preferences";
export const cookiePreferenceChange = "responku:cookie-preferences";
export const openCookiePreferences = "responku:open-cookie-preferences";

export function getCookiePreference() {
  const entry = document.cookie.split(";").map((item) => item.trim())
    .find((item) => item.startsWith(`${cookiePreferenceName}=`));
  const value = entry?.slice(cookiePreferenceName.length + 1);
  return value === "accept" || value === "reject" ? value : null;
}
