const KEY = "ludo-genius-device-id";

/** معرّف ثابت للجهاز يُستخدم لتمييز اللاعب داخل الغرف (بدون حساب) */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = `p_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    window.localStorage.setItem(KEY, id);
  }
  return id;
}
